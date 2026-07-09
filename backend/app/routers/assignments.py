from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_teacher
from app.database import get_db
from app.models.assignment import Assignment
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentResponse

router = APIRouter(prefix="/api/assignments", tags=["assignments"])


def _to_response(assignment: Assignment) -> AssignmentResponse:
    return AssignmentResponse(
        id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date,
        created_by=assignment.created_by,
        created_at=assignment.created_at,
        creator_name=assignment.creator.full_name if assignment.creator else None,
    )


@router.get("", response_model=list[AssignmentResponse])
def list_assignments(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    assignments = db.query(Assignment).order_by(Assignment.due_date.asc()).all()
    return [_to_response(a) for a in assignments]


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    assignment = Assignment(
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        created_by=current_user.id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment)
