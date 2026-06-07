from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    nickname: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    nickname: str
    gender: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    gender: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class EmailCheckRequest(BaseModel):
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut
