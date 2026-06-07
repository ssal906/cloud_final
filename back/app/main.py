import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.config import UPLOAD_DIR
from app.routers import auth, profile, ledger, documents, schedules, todos, memos, chat

Base.metadata.create_all(bind=engine)

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "profiles"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "documents"), exist_ok=True)

app = FastAPI(
    title="Life Manager API",
    description="개인 자기관리 통합 플랫폼 API",
    version="1.0.0",
)

_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(ledger.router)
app.include_router(documents.router)
app.include_router(schedules.router)
app.include_router(todos.router)
app.include_router(memos.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"message": "Life Manager API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
