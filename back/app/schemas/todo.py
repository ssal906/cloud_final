from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class TodoCreate(BaseModel):
    title: str
    due_date: Optional[date] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[date] = None


class TodoOut(BaseModel):
    id: int
    title: str
    is_completed: bool
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TodoStats(BaseModel):
    date: str
    total: int
    completed: int
    rate: float
