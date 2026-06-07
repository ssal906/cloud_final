from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.user import UserRegister, UserLogin, UserOut, Token, EmailCheckRequest
from app.utils.auth import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/check-email")
def check_email(data: EmailCheckRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
    return {"available": True, "message": "사용 가능한 이메일입니다."}


@router.post("/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="비밀번호는 6자 이상이어야 합니다.")

    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")

    user = models.User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        nickname=data.nickname,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))
