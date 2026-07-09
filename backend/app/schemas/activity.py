from datetime import date, datetime

from pydantic import BaseModel


class ActivityCreate(BaseModel):
    title: str
    description: str
    date: date


class ActivityResponse(BaseModel):
    id: int
    title: str
    description: str
    date: date
    created_by: int
    created_at: datetime
    creator_name: str | None = None

    model_config = {"from_attributes": True}
