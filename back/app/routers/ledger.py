from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.ledger import LedgerItemCreate, LedgerItemUpdate, LedgerItemOut, LedgerSummary
from app.utils.auth import get_current_user
from typing import List

router = APIRouter(prefix="/ledger", tags=["ledger"])


@router.get("/summary", response_model=LedgerSummary)
def get_summary(year: int = None, month: int = None, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    today = date.today()
    year = year or today.year
    month = month or today.month

    items = db.query(models.LedgerItem).filter(
        models.LedgerItem.user_id == current_user.id,
        models.LedgerItem.item_date != None,
    ).all()

    this_month_items = [i for i in items if i.item_date.year == year and i.item_date.month == month]
    total = sum(i.price for i in this_month_items)

    prev_year, prev_month = (year, month - 1) if month > 1 else (year - 1, 12)
    prev_items = [i for i in items if i.item_date.year == prev_year and i.item_date.month == prev_month]
    prev_total = sum(i.price for i in prev_items)

    no_date_items = [i for i in db.query(models.LedgerItem).filter(
        models.LedgerItem.user_id == current_user.id,
        models.LedgerItem.item_date == None,
    ).all()]

    all_items = this_month_items + no_date_items if year == today.year and month == today.month else this_month_items

    return LedgerSummary(
        year=year, month=month,
        total=total, prev_total=prev_total,
        items=[LedgerItemOut.model_validate(i) for i in all_items]
    )


@router.post("/", response_model=LedgerItemOut)
def create_item(data: LedgerItemCreate, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    item = models.LedgerItem(
        user_id=current_user.id,
        name=data.name,
        price=data.price,
        necessity=data.necessity,
        item_date=data.item_date,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=LedgerItemOut)
def update_item(item_id: int, data: LedgerItemUpdate, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    item = db.query(models.LedgerItem).filter(
        models.LedgerItem.id == item_id, models.LedgerItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다.")

    if data.name is not None:
        item.name = data.name
    if data.price is not None:
        item.price = data.price
    if data.necessity is not None:
        item.necessity = data.necessity
    if data.item_date is not None:
        item.item_date = data.item_date

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    item = db.query(models.LedgerItem).filter(
        models.LedgerItem.id == item_id, models.LedgerItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다.")
    db.delete(item)
    db.commit()
    return {"message": "삭제되었습니다."}
