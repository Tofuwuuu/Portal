from datetime import datetime

from pydantic import BaseModel, Field


class SubmissionGrade(BaseModel):
    grade: int = Field(ge=0, le=100)
    feedback: str = ""


class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    student_name: str | None = None
    note: str
    is_done: bool
    file_name: str | None = None
    has_file: bool = False
    grade: int | None = None
    feedback: str | None = None
    graded_at: datetime | None = None
    submitted_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
