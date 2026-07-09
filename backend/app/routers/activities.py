from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_teacher
from app.database import get_db
from app.models.activity import Activity
from app.models.user import User, UserRole
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate

router = APIRouter(prefix="/api/activities", tags=["activities"])


def _to_response(activity: Activity) -> ActivityResponse:
    return ActivityResponse(
        id=activity.id,
        title=activity.title,
        description=activity.description,
        date=activity.date,
        created_by=activity.created_by,
        created_at=activity.created_at,
        is_published=activity.is_published,
        is_archived=activity.is_archived,
        creator_name=activity.creator.full_name if activity.creator else None,
    )


def _get_activity_or_404(db: Session, activity_id: int) -> Activity:
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return activity


@router.get("", response_model=list[ActivityResponse])
def list_activities(
    include_archived: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Activity)

    if not include_archived:
        query = query.filter(Activity.is_archived.is_(False))

    if current_user.role != UserRole.teacher:
        query = query.filter(Activity.is_published.is_(True), Activity.is_archived.is_(False))

    activities = query.order_by(Activity.date.desc()).all()
    return [_to_response(a) for a in activities]


@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    activity = Activity(
        title=data.title,
        description=data.description,
        date=data.date,
        created_by=current_user.id,
        is_published=True,
        is_archived=False,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return _to_response(activity)


@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    data: ActivityUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    activity = _get_activity_or_404(db, activity_id)
    activity.title = data.title
    activity.description = data.description
    activity.date = data.date
    db.commit()
    db.refresh(activity)
    return _to_response(activity)


@router.post("/{activity_id}/publish", response_model=ActivityResponse)
def publish_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    activity = _get_activity_or_404(db, activity_id)
    activity.is_published = True
    db.commit()
    db.refresh(activity)
    return _to_response(activity)


@router.post("/{activity_id}/unpublish", response_model=ActivityResponse)
def unpublish_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    activity = _get_activity_or_404(db, activity_id)
    activity.is_published = False
    db.commit()
    db.refresh(activity)
    return _to_response(activity)


@router.post("/{activity_id}/archive", response_model=ActivityResponse)
def archive_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    activity = _get_activity_or_404(db, activity_id)
    activity.is_archived = True
    db.commit()
    db.refresh(activity)
    return _to_response(activity)


@router.post("/{activity_id}/unarchive", response_model=ActivityResponse)
def unarchive_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    activity = _get_activity_or_404(db, activity_id)
    activity.is_archived = False
    db.commit()
    db.refresh(activity)
    return _to_response(activity)


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    activity = _get_activity_or_404(db, activity_id)
    db.delete(activity)
    db.commit()
