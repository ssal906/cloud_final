from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract, or_
from typing import List, Optional
from app.database import get_db
from app import models
from app.schemas.todo import TodoCreate, TodoUpdate, TodoOut, TodoStats
from app.utils.auth import get_current_user

router = APIRouter(prefix="/todos", tags=["todos"])


@router.delete("/cleanup")
def cleanup_old_todos(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cutoff = date.today() - timedelta(days=7)
    db.query(models.Todo).filter(
        models.Todo.user_id == current_user.id,
        models.Todo.due_date != None,
        models.Todo.due_date < cutoff,
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "정리 완료"}


@router.get("/stats", response_model=List[TodoStats])
def get_stats(year: int = None, month: int = None, db: Session = Depends(get_db),
              current_user: models.User = Depends(get_current_user)):
    today = date.today()
    year = year or today.year
    month = month or today.month

    todos = db.query(models.Todo).filter(
        models.Todo.user_id == current_user.id,
        models.Todo.due_date != None,
        extract('year', models.Todo.due_date) == year,
        extract('month', models.Todo.due_date) == month,
    ).all()

    stats_map = {}
    for todo in todos:
        key = str(todo.due_date)
        if key not in stats_map:
            stats_map[key] = {"total": 0, "completed": 0}
        stats_map[key]["total"] += 1
        if todo.is_completed:
            stats_map[key]["completed"] += 1

    return [
        TodoStats(
            date=k,
            total=v["total"],
            completed=v["completed"],
            rate=round(v["completed"] / v["total"] * 100, 1) if v["total"] > 0 else 0
        )
        for k, v in stats_map.items()
    ]


@router.get("/", response_model=List[TodoOut])
def list_todos(
    completed: Optional[bool] = None,
    due_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()
    query = db.query(models.Todo).filter(models.Todo.user_id == current_user.id)

    if due_date is not None:
        if due_date == today:
            # 오늘: 오늘 마감 + 날짜 없는 항목 모두 표시
            query = query.filter(
                or_(models.Todo.due_date == today, models.Todo.due_date == None)
            )
        else:
            query = query.filter(models.Todo.due_date == due_date)

    if completed is not None:
        query = query.filter(models.Todo.is_completed == completed)

    return query.order_by(models.Todo.created_at.desc()).all()


@router.post("/", response_model=TodoOut)
def create_todo(data: TodoCreate, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    todo = models.Todo(
        user_id=current_user.id,
        title=data.title,
        due_date=data.due_date,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.put("/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, data: TodoUpdate, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id, models.Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="할 일을 찾을 수 없습니다.")

    if data.title is not None:
        todo.title = data.title
    if data.due_date is not None:
        todo.due_date = data.due_date

    db.commit()
    db.refresh(todo)
    return todo


@router.patch("/{todo_id}/toggle", response_model=TodoOut)
def toggle_todo(todo_id: int, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id, models.Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="할 일을 찾을 수 없습니다.")

    todo.is_completed = not todo.is_completed
    todo.completed_at = datetime.utcnow() if todo.is_completed else None
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id, models.Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="할 일을 찾을 수 없습니다.")
    db.delete(todo)
    db.commit()
    return {"message": "삭제되었습니다."}
