from datetime import datetime, timedelta
from typing import Literal

from pydantic import BaseModel, Field

TimeStatus = Literal["upcoming", "live", "ended"]


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    starts_at: datetime
    duration_minutes: int = Field(default=60, ge=15, le=480)


class MeetingUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    starts_at: datetime
    duration_minutes: int = Field(default=60, ge=15, le=480)


class MeetingResponse(BaseModel):
    id: int
    title: str
    description: str
    starts_at: datetime
    duration_minutes: int
    room_slug: str
    created_by: int
    created_at: datetime
    is_active: bool
    time_status: TimeStatus
    creator_name: str | None = None

    model_config = {"from_attributes": True}
