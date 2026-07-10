from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_teacher
from app.database import get_db
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentCreate, AssignmentResponse, AssignmentUpdate
from app.schemas.submission import SubmissionCreate, SubmissionResponse

router = APIRouter(prefix="/api/assignments", tags=["assignments"])


def _submission_to_response(submission: Submission) -> SubmissionResponse:
    return SubmissionResponse(
        id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        student_name=submission.student.full_name if submission.student else None,
        note=submission.note,
        is_done=submission.is_done,
        submitted_at=submission.submitted_at,
        updated_at=submission.updated_at,
    )


def _to_response(
    assignment: Assignment,
    current_user: User | None = None,
) -> AssignmentResponse:
    my_submission = None
    submission_count = 0

    if current_user and current_user.role == UserRole.teacher:
        submission_count = len(assignment.submissions) if assignment.submissions is not None else 0

    if current_user and current_user.role == UserRole.student:
        for submission in assignment.submissions or []:
            if submission.student_id == current_user.id:
                my_submission = _submission_to_response(submission)
                break

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
        submission_count=submission_count,
        my_submission=my_submission,
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
    return [_to_response(a, current_user) for a in assignments]


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
    return _to_response(assignment, current_user)


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.title = data.title
    assignment.description = data.description
    assignment.due_date = data.due_date
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment, current_user)


@router.post("/{assignment_id}/publish", response_model=AssignmentResponse)
def publish_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.is_published = True
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment, current_user)


@router.post("/{assignment_id}/unpublish", response_model=AssignmentResponse)
def unpublish_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.is_published = False
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment, current_user)


@router.post("/{assignment_id}/archive", response_model=AssignmentResponse)
def archive_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.is_archived = True
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment, current_user)


@router.post("/{assignment_id}/unarchive", response_model=AssignmentResponse)
def unarchive_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    assignment.is_archived = False
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment, current_user)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    db.delete(assignment)
    db.commit()


@router.post("/{assignment_id}/submit", response_model=SubmissionResponse)
def submit_assignment(
    assignment_id: int,
    data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments",
        )

    assignment = _get_assignment_or_404(db, assignment_id)
    if not assignment.is_published or assignment.is_archived:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assignment is not available for submission",
        )

    submission = (
        db.query(Submission)
        .filter(
            Submission.assignment_id == assignment_id,
            Submission.student_id == current_user.id,
        )
        .first()
    )

    now = datetime.utcnow()
    if submission:
        submission.note = data.note.strip()
        submission.is_done = data.is_done
        submission.updated_at = now
    else:
        submission = Submission(
            assignment_id=assignment_id,
            student_id=current_user.id,
            note=data.note.strip(),
            is_done=data.is_done,
            submitted_at=now,
            updated_at=now,
        )
        db.add(submission)

    db.commit()
    db.refresh(submission)
    return _submission_to_response(submission)


@router.get("/{assignment_id}/submissions", response_model=list[SubmissionResponse])
def list_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    _get_assignment_or_404(db, assignment_id)
    submissions = (
        db.query(Submission)
        .filter(Submission.assignment_id == assignment_id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    return [_submission_to_response(s) for s in submissions]


@router.get("/{assignment_id}/my-submission", response_model=SubmissionResponse | None)
def get_my_submission(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_assignment_or_404(db, assignment_id)
    submission = (
        db.query(Submission)
        .filter(
            Submission.assignment_id == assignment_id,
            Submission.student_id == current_user.id,
        )
        .first()
    )
    if not submission:
        return None
    return _submission_to_response(submission)
