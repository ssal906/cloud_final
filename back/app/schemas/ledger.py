from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class LedgerItemCreate(BaseModel):
    name: str
    price: int
    necessity: str  # high, medium, low
    item_date: Optional[date] = None


class LedgerItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    necessity: Optional[str] = None
    item_date: Optional[date] = None


class LedgerItemOut(BaseModel):
    id: int
    name: str
    price: int
    necessity: str
    item_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LedgerSummary(BaseModel):
    year: int
    month: int
    total: int
    prev_total: int
    items: list[LedgerItemOut]
