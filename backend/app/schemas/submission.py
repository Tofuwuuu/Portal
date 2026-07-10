from datetime import datetime

from pydantic import BaseModel, Field


class SubmissionCreate(BaseModel):
    note: str = Field(default="", max_length=2000)
    is_done: bool = True


class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    student_name: str | None = None
    note: str
    is_done: bool
    submitted_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
