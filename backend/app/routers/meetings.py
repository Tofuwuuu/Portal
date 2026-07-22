import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_teacher
from app.database import get_db
from app.models.meeting import Meeting
from app.models.user import User, UserRole
from app.schemas.meeting import MeetingCreate, MeetingResponse, MeetingUpdate, TimeStatus
from app.services.daily import ensure_daily_room

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _compute_time_status(meeting: Meeting, now: datetime | None = None) -> TimeStatus:
    now = now or datetime.utcnow()
    ends_at = meeting.starts_at + timedelta(minutes=meeting.duration_minutes)

    if not meeting.is_active or now >= ends_at:
        return "ended"
    if now >= meeting.starts_at:
        return "live"
    return "upcoming"


def _expire_past_meetings(db: Session) -> None:
    now = datetime.utcnow()
    meetings = db.query(Meeting).filter(Meeting.is_active.is_(True)).all()
    changed = False
    for meeting in meetings:
        ends_at = meeting.starts_at + timedelta(minutes=meeting.duration_minutes)
        if now >= ends_at:
            meeting.is_active = False
            changed = True
    if changed:
        db.commit()


def _to_response(meeting: Meeting) -> MeetingResponse:
    return MeetingResponse(
        id=meeting.id,
        title=meeting.title,
        description=meeting.description,
        starts_at=meeting.starts_at,
        duration_minutes=meeting.duration_minutes,
        room_slug=meeting.room_slug,
        created_by=meeting.created_by,
        created_at=meeting.created_at,
        is_active=meeting.is_active,
        time_status=_compute_time_status(meeting),
        creator_name=meeting.creator.full_name if meeting.creator else None,
    )


def _get_meeting_or_404(db: Session, meeting_id: int) -> Meeting:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return meeting


@router.get("", response_model=list[MeetingResponse])
def list_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _expire_past_meetings(db)
    query = db.query(Meeting)

    if current_user.role != UserRole.teacher:
        query = query.filter(Meeting.is_active.is_(True))

    meetings = query.order_by(Meeting.starts_at.asc()).all()
    return [_to_response(m) for m in meetings]


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _expire_past_meetings(db)
    meeting = _get_meeting_or_404(db, meeting_id)
    if current_user.role != UserRole.teacher and not meeting.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    ensure_daily_room(meeting.room_slug)
    return _to_response(meeting)


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    meeting = Meeting(
        title=data.title.strip(),
        description=data.description.strip(),
        starts_at=data.starts_at,
        duration_minutes=data.duration_minutes,
        room_slug=f"portal-{uuid.uuid4().hex[:12]}",
        created_by=current_user.id,
        is_active=True,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    ensure_daily_room(meeting.room_slug)
    return _to_response(meeting)


@router.patch("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: int,
    data: MeetingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    meeting = _get_meeting_or_404(db, meeting_id)
    meeting.title = data.title.strip()
    meeting.description = data.description.strip()
    meeting.starts_at = data.starts_at
    meeting.duration_minutes = data.duration_minutes
    db.commit()
    db.refresh(meeting)
    return _to_response(meeting)


@router.post("/{meeting_id}/end", response_model=MeetingResponse)
def end_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    meeting = _get_meeting_or_404(db, meeting_id)
    meeting.is_active = False
    db.commit()
    db.refresh(meeting)
    return _to_response(meeting)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    meeting = _get_meeting_or_404(db, meeting_id)
    db.delete(meeting)
    db.commit()
