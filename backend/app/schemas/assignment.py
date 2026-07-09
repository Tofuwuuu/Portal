from datetime import date, datetime

from pydantic import BaseModel


class AssignmentCreate(BaseModel):
    title: str
    description: str
    due_date: date


class AssignmentUpdate(BaseModel):
    title: str
    description: str
    due_date: date


class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: str
    due_date: date
    created_by: int
    created_at: datetime
    is_published: bool
    is_archived: bool
    creator_name: str | None = None

    model_config = {"from_attributes": True}
