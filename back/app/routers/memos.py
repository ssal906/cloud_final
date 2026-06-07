from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models
from app.schemas.memo import MemoCreate, MemoUpdate, MemoOut, MemoFolderCreate, MemoFolderOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/memos", tags=["memos"])


@router.get("/folders", response_model=List[MemoFolderOut])
def list_folders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.MemoFolder).filter(models.MemoFolder.user_id == current_user.id).all()


@router.post("/folders", response_model=MemoFolderOut)
def create_folder(data: MemoFolderCreate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    folder = models.MemoFolder(user_id=current_user.id, name=data.name)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    folder = db.query(models.MemoFolder).filter(
        models.MemoFolder.id == folder_id, models.MemoFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="폴더를 찾을 수 없습니다.")
    db.delete(folder)
    db.commit()
    return {"message": "폴더가 삭제되었습니다."}


@router.get("/", response_model=List[MemoOut])
def list_memos(folder_id: Optional[int] = None, db: Session = Depends(get_db),
               current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Memo).filter(models.Memo.user_id == current_user.id)
    if folder_id is not None:
        query = query.filter(models.Memo.folder_id == folder_id)
    return query.order_by(models.Memo.updated_at.desc()).all()


@router.post("/", response_model=MemoOut)
def create_memo(data: MemoCreate, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    memo = models.Memo(
        user_id=current_user.id,
        title=data.title,
        content=data.content,
        folder_id=data.folder_id,
    )
    db.add(memo)
    db.commit()
    db.refresh(memo)
    return memo


@router.put("/{memo_id}", response_model=MemoOut)
def update_memo(memo_id: int, data: MemoUpdate, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    memo = db.query(models.Memo).filter(
        models.Memo.id == memo_id, models.Memo.user_id == current_user.id
    ).first()
    if not memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(memo, field, value)

    db.commit()
    db.refresh(memo)
    return memo


@router.delete("/{memo_id}")
def delete_memo(memo_id: int, db: Session = Depends(get_db),
                current_user: models.User = Depends(get_current_user)):
    memo = db.query(models.Memo).filter(
        models.Memo.id == memo_id, models.Memo.user_id == current_user.id
    ).first()
    if not memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    db.delete(memo)
    db.commit()
    return {"message": "삭제되었습니다."}
