from pydantic import BaseModel
from datetime import datetime


class ChatRequest(BaseModel):
    message: str


class ChatMessageOut(BaseModel):
    id: int
    user_message: str
    ai_response: str
    created_at: datetime

    class Config:
        from_attributes = True
