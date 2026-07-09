from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_teacher
from app.database import get_db
from app.models.assignment import Assignment
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentCreate, AssignmentResponse, AssignmentUpdate

router = APIRouter(prefix="/api/assignments", tags=["assignments"])


def _to_response(assignment: Assignment) -> AssignmentResponse:
    return AssignmentResponse(
        id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date,
        created_by=assignment.created_by,
        created_at=assignment.created_at,
        is_published=assignment.is_published,
        is_archived=assignment.is_archived,
        creator_name=assignment.creator.full_name if assignment.creator else None,
    )


def _get_assignment_or_404(db: Session, assignment_id: int) -> Assignment:
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment


@router.get("", response_model=list[AssignmentResponse])
def list_assignments(
    include_archived: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Assignment)

    if not include_archived:
        query = query.filter(Assignment.is_archived.is_(False))

    if current_user.role != UserRole.teacher:
        query = query.filter(Assignment.is_published.is_(True), Assignment.is_archived.is_(False))

    assignments = query.order_by(Assignment.due_date.asc()).all()
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
        is_published=True,
        is_archived=False,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment)


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    data: AssignmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.title = data.title
    assignment.description = data.description
    assignment.due_date = data.due_date
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment)


@router.post("/{assignment_id}/publish", response_model=AssignmentResponse)
def publish_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.is_published = True
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment)


@router.post("/{assignment_id}/unpublish", response_model=AssignmentResponse)
def unpublish_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.is_published = False
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment)


@router.post("/{assignment_id}/archive", response_model=AssignmentResponse)
def archive_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.is_archived = True
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment)


@router.post("/{assignment_id}/unarchive", response_model=AssignmentResponse)
def unarchive_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.is_archived = False
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    db.delete(assignment)
    db.commit()
