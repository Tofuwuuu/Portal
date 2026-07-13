from datetime import datetime

from pydantic import BaseModel, Field


class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    student_name: str | None = None
    note: str
    is_done: bool
    file_name: str | None = None
    has_file: bool = False
    submitted_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
