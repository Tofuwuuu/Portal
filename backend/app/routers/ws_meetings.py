"""
WebSocket signaling for 1-on-1 WebRTC meetings.

Signaling flow (offer/answer/ICE):
  1. Both peers connect with JWT ?token= on /api/ws/meetings/{meeting_id}
  2. First peer gets {type: ready, initiator: true}; second gets initiator: false
  3. When the second peer joins, the first receives {type: peer-joined}
  4. Initiator creates an SDP offer -> server relays -> joiner sends answer -> relayed back
  5. ICE candidates are exchanged through the server until P2P media connects
  6. Audio/video flows directly between browsers (STUN/TURN); server only relays JSON
"""

import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.auth.security import decode_access_token
from app.database import SessionLocal
from app.models.meeting import Meeting
from app.models.user import User, UserRole
from app.routers.meetings import _compute_time_status, _expire_past_meetings

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory room state: room_slug -> {user_id: WebSocket}
# Safe for single uvicorn worker (Railway default). Would need Redis if scaled horizontally.
rooms: dict[str, dict[int, WebSocket]] = {}

RELAY_TYPES = frozenset({"offer", "answer", "ice-candidate", "leave"})


def _peer_info(user: User) -> dict[str, Any]:
    return {"id": user.id, "full_name": user.full_name, "role": user.role.value}


def _load_user_and_meeting(
    db: Session, token: str, meeting_id: int
) -> tuple[str, User | None, Meeting | None]:
    """Returns (error_code, user, meeting). error_code is empty on success."""
    payload = decode_access_token(token)
    if payload is None:
        return "4401", None, None

    user_id = payload.get("sub")
    if user_id is None:
        return "4401", None, None

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        return "4401", None, None

    _expire_past_meetings(db)
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if meeting is None:
        return "4404", user, None

    return "", user, meeting


def _can_join(user: User, meeting: Meeting) -> bool:
    if user.role == UserRole.teacher:
        return meeting.is_active
    return meeting.is_active and _compute_time_status(meeting) == "live"


async def _send_json(ws: WebSocket, payload: dict[str, Any]) -> None:
    await ws.send_text(json.dumps(payload))


async def _send_to_peer(room_slug: str, sender_id: int, payload: dict[str, Any]) -> None:
    room = rooms.get(room_slug, {})
    for uid, peer_ws in room.items():
        if uid != sender_id:
            await _send_json(peer_ws, payload)


def _remove_from_room(room_slug: str, user_id: int) -> None:
    room = rooms.get(room_slug)
    if not room:
        return
    room.pop(user_id, None)
    if not room:
        rooms.pop(room_slug, None)


@router.websocket("/api/ws/meetings/{meeting_id}")
async def meeting_signaling(websocket: WebSocket, meeting_id: int, token: str = "") -> None:
    if not token:
        await websocket.close(code=4401, reason="Missing token")
        return

    db = SessionLocal()
    try:
        error_code, user, meeting = _load_user_and_meeting(db, token, meeting_id)
    finally:
        db.close()

    if error_code == "4401":
        await websocket.close(code=4401, reason="Invalid token")
        return
    if error_code == "4404" or meeting is None or user is None:
        await websocket.close(code=4404, reason="Meeting not found")
        return

    if not _can_join(user, meeting):
        await websocket.close(code=4403, reason="Not allowed to join this meeting")
        return

    room_slug = meeting.room_slug
    room = rooms.setdefault(room_slug, {})

    if len(room) >= 2:
        await websocket.accept()
        await _send_json(websocket, {"type": "room-full", "message": "This room already has 2 participants"})
        await websocket.close(code=4409, reason="Room full")
        return

    await websocket.accept()
    is_initiator = len(room) == 0
    room[user.id] = websocket

    existing_peer_id = next((uid for uid in room if uid != user.id), None)
    peer_info = None
    if existing_peer_id is not None:
        # Load peer name for display (best-effort)
        db = SessionLocal()
        try:
            peer_user = db.query(User).filter(User.id == existing_peer_id).first()
            if peer_user:
                peer_info = _peer_info(peer_user)
        finally:
            db.close()

    await _send_json(
        websocket,
        {
            "type": "ready",
            "initiator": is_initiator,
            "self": _peer_info(user),
            "peer": peer_info,
        },
    )

    if existing_peer_id is not None:
        await _send_to_peer(
            room_slug,
            user.id,
            {"type": "peer-joined", "peer": _peer_info(user)},
        )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = message.get("type")
            if msg_type in RELAY_TYPES:
                await _send_to_peer(room_slug, user.id, message)
                if msg_type == "leave":
                    break
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WebSocket error for user %s in room %s", user.id, room_slug)
    finally:
        _remove_from_room(room_slug, user.id)
        await _send_to_peer(room_slug, user.id, {"type": "peer-left"})
