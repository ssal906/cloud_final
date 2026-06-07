from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentCreate(BaseModel):
    title: str
    doc_type: str
    notion_url: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    doc_type: Optional[str] = None
    notion_url: Optional[str] = None


class DocumentOut(BaseModel):
    id: int
    title: str
    doc_type: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    notion_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
