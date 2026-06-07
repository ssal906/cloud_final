import time
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from app.config import DATABASE_URL

def create_engine_with_retry(url, retries=10, delay=5):
    for attempt in range(retries):
        try:
            engine = create_engine(url, pool_pre_ping=True)
            with engine.connect() as conn:
                pass
            return engine
        except OperationalError:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                raise

engine = create_engine_with_retry(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
