from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScheduleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    color: Optional[str] = "#4F46E5"
    all_day: Optional[bool] = False


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    color: Optional[str] = None
    all_day: Optional[bool] = None


class ScheduleOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    color: str
    all_day: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
