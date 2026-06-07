from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import models
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.get("/", response_model=List[ScheduleOut])
def list_schedules(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Schedule).filter(models.Schedule.user_id == current_user.id)
    if start:
        query = query.filter(models.Schedule.end_datetime >= datetime.fromisoformat(start))
    if end:
        query = query.filter(models.Schedule.start_datetime <= datetime.fromisoformat(end))
    return query.order_by(models.Schedule.start_datetime).all()


@router.post("/", response_model=ScheduleOut)
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    schedule = models.Schedule(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        start_datetime=data.start_datetime,
        end_datetime=data.end_datetime,
        color=data.color or "#4F46E5",
        all_day=data.all_day or False,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int, data: ScheduleUpdate, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    schedule = db.query(models.Schedule).filter(
        models.Schedule.id == schedule_id, models.Schedule.user_id == current_user.id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    schedule = db.query(models.Schedule).filter(
        models.Schedule.id == schedule_id, models.Schedule.user_id == current_user.id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    db.delete(schedule)
    db.commit()
    return {"message": "삭제되었습니다."}
