import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://appuser:apppassword123@localhost:3306/life_manager")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
