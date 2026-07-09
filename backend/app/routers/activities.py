from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_teacher
from app.database import get_db
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityResponse

router = APIRouter(prefix="/api/activities", tags=["activities"])


def _to_response(activity: Activity) -> ActivityResponse:
    return ActivityResponse(
        id=activity.id,
        title=activity.title,
        description=activity.description,
        date=activity.date,
        created_by=activity.created_by,
        created_at=activity.created_at,
        creator_name=activity.creator.full_name if activity.creator else None,
    )


@router.get("", response_model=list[ActivityResponse])
def list_activities(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    activities = db.query(Activity).order_by(Activity.date.desc()).all()
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
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return _to_response(activity)
