import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.user import UserOut, UserUpdate, PasswordChange
from app.utils.auth import get_current_user, verify_password, get_password_hash
from app.config import UPLOAD_DIR

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserOut)
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_profile(data: UserUpdate, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    if data.nickname is not None:
        current_user.nickname = data.nickname
    if data.gender is not None:
        current_user.gender = data.gender
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(data: PasswordChange, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="새 비밀번호는 6자 이상이어야 합니다.")
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "비밀번호가 변경되었습니다."}


@router.post("/picture", response_model=UserOut)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    profile_dir = os.path.join(UPLOAD_DIR, "profiles", str(current_user.id))
    os.makedirs(profile_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"profile.{ext}"
    file_path = os.path.join(profile_dir, filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    current_user.profile_picture = f"/uploads/profiles/{current_user.id}/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user
