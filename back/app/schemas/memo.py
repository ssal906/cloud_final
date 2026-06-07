from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MemoFolderCreate(BaseModel):
    name: str


class MemoFolderOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class MemoCreate(BaseModel):
    title: str
    content: Optional[str] = None
    folder_id: Optional[int] = None


class MemoUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[int] = None


class MemoOut(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    folder_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
