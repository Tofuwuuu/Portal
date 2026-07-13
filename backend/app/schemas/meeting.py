from datetime import datetime

from pydantic import BaseModel, Field


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    starts_at: datetime


class MeetingUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    starts_at: datetime


class MeetingResponse(BaseModel):
    id: int
    title: str
    description: str
    starts_at: datetime
    room_slug: str
    created_by: int
    created_at: datetime
    is_active: bool
    creator_name: str | None = None

    model_config = {"from_attributes": True}
