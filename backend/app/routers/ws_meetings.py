"""
WebSocket signaling for 1-on-1 WebRTC meetings.

Signaling flow (offer/answer/ICE):
  1. Both peers connect with JWT ?token= on /api/ws/meetings/{meeting_id}
  2. First peer gets {type: ready, initiator: true}; second gets initiator: false
  3. When the second peer joins, the first receives {type: peer-joined}
  4. Initiator creates an SDP offer -> server relays -> joiner sends answer -> relayed back
  5. ICE candidates are exchanged through the server until P2P media connects
  6. Audio/video flows directly between browsers (STUN/TURN); server only relays JSON

Presenter mode (in-app shared lesson area, relayed over this same socket):
  - The server holds one authoritative `presenter_states[room_slug]` dict per room:
    {"active": bool, "slides": [...], "currentIndex": int}
  - "presenter-update" (teacher -> server): mutate state (start/stop/set-index/
    add-slide/remove-slide). Rejected (ignored) if the sender is not a teacher.
  - "presenter-state" (server -> both peers): the full current state, broadcast after
    any successful update, and also sent once right after "ready" so a late joiner
    (or reconnecting peer) is synced without any teacher action.
  - "presenter-request" (student -> server): server replies with "presenter-state"
    directly to the requester (no teacher round-trip needed).
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

# In-memory presenter state: room_slug -> {"active", "slides", "currentIndex"}
# Same single-worker assumption as `rooms`; would need a shared store (e.g. Redis)
# if the backend were ever scaled to multiple processes/instances.
presenter_states: dict[str, dict[str, Any]] = {}

RELAY_TYPES = frozenset({"offer", "answer", "ice-candidate", "leave"})
PRESENTER_ACTIONS = frozenset({"start", "stop", "set-index", "add-slide", "remove-slide"})
MAX_SLIDES_PER_ROOM = 50
MAX_MESSAGE_BYTES = 6 * 1024 * 1024  # generous headroom for a base64 image slide


def _peer_info(user: User) -> dict[str, Any]:
    return {"id": user.id, "full_name": user.full_name, "role": user.role.value}


def _default_presenter_state() -> dict[str, Any]:
    return {"active": False, "slides": [], "currentIndex": 0}


def _is_valid_slide(slide: Any) -> bool:
    if not isinstance(slide, dict):
        return False

    slide_type = slide.get("type")
    if slide_type == "image":
        src = slide.get("src")
        return isinstance(src, str) and src.startswith("data:image/")
    if slide_type == "url":
        url = slide.get("url")
        return isinstance(url, str) and (url.startswith("http://") or url.startswith("https://"))
    if slide_type == "text":
        return isinstance(slide.get("title"), str) and isinstance(slide.get("body"), str)
    return False


def _apply_presenter_update(state: dict[str, Any], message: dict[str, Any]) -> None:
    """Mutates `state` in place based on a validated teacher action."""
    action = message.get("action")
    slides: list[Any] = state["slides"]

    if action == "start":
        state["active"] = True
    elif action == "stop":
        state["active"] = False
    elif action == "set-index":
        index = message.get("index")
        if isinstance(index, int) and 0 <= index < len(slides):
            state["currentIndex"] = index
    elif action == "add-slide":
        slide = message.get("slide")
        if _is_valid_slide(slide) and len(slides) < MAX_SLIDES_PER_ROOM:
            slides.append(slide)
            state["currentIndex"] = len(slides) - 1
    elif action == "remove-slide":
        index = message.get("index")
        if isinstance(index, int) and 0 <= index < len(slides):
            slides.pop(index)
            if state["currentIndex"] >= len(slides):
                state["currentIndex"] = max(0, len(slides) - 1)


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


async def _broadcast_presenter_state(room_slug: str) -> None:
    state = presenter_states.get(room_slug, _default_presenter_state())
    payload = {"type": "presenter-state", "state": state}
    for peer_ws in rooms.get(room_slug, {}).values():
        await _send_json(peer_ws, payload)


def _remove_from_room(room_slug: str, user_id: int) -> None:
    room = rooms.get(room_slug)
    if not room:
        return
    room.pop(user_id, None)
    if not room:
        rooms.pop(room_slug, None)
        presenter_states.pop(room_slug, None)


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

    # Sync presenter state immediately so late joiners / reconnects see the current
    # slide without waiting on any teacher action.
    await _send_json(
        websocket,
        {
            "type": "presenter-state",
            "state": presenter_states.get(room_slug, _default_presenter_state()),
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
            if len(raw) > MAX_MESSAGE_BYTES:
                continue

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = message.get("type")

            if msg_type in RELAY_TYPES:
                await _send_to_peer(room_slug, user.id, message)
                if msg_type == "leave":
                    break
            elif msg_type == "presenter-update":
                if user.role != UserRole.teacher:
                    continue
                if message.get("action") not in PRESENTER_ACTIONS:
                    continue
                state = presenter_states.setdefault(room_slug, _default_presenter_state())
                _apply_presenter_update(state, message)
                await _broadcast_presenter_state(room_slug)
            elif msg_type == "presenter-request":
                await _send_json(
                    websocket,
                    {
                        "type": "presenter-state",
                        "state": presenter_states.get(room_slug, _default_presenter_state()),
                    },
                )
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WebSocket error for user %s in room %s", user.id, room_slug)
    finally:
        _remove_from_room(room_slug, user.id)
        await _send_to_peer(room_slug, user.id, {"type": "peer-left"})
