from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models
from app.schemas.chat import ChatRequest, ChatMessageOut
from app.utils.auth import get_current_user
from app.utils.ai import build_user_context, get_ai_response

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/history", response_model=List[ChatMessageOut])
def get_history(limit: int = 50, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    return db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.created_at.desc()).limit(limit).all()


@router.post("/", response_model=ChatMessageOut)
def send_message(data: ChatRequest, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    ledger_items = db.query(models.LedgerItem).filter(
        models.LedgerItem.user_id == current_user.id
    ).all()
    todos = db.query(models.Todo).filter(
        models.Todo.user_id == current_user.id
    ).all()
    schedules = db.query(models.Schedule).filter(
        models.Schedule.user_id == current_user.id
    ).all()
    documents = db.query(models.Document).filter(
        models.Document.user_id == current_user.id
    ).all()

    context = build_user_context(current_user, ledger_items, todos, schedules, documents)
    ai_response = get_ai_response(data.message, context)

    chat_msg = models.ChatMessage(
        user_id=current_user.id,
        user_message=data.message,
        ai_response=ai_response,
    )
    db.add(chat_msg)
    db.commit()
    db.refresh(chat_msg)
    return chat_msg
