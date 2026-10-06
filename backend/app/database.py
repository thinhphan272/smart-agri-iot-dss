import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

# Tự động tìm nạp tệp .env ở thư mục gốc hoặc backend
dotenv_path = os.path.join(PROJECT_ROOT, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    backend_env = os.path.join(PROJECT_ROOT, "backend", ".env")
    if os.path.exists(backend_env):
        load_dotenv(backend_env)
    else:
        load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/agri_iot_db"
)

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

# Kiểm tra kết nối; nếu PostgreSQL không hoạt động (ví dụ máy bạn bè chưa cài PostgreSQL)
# thì tự động chuyển sang SQLite nội bộ để chạy được ngay 100%
try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
    with engine.connect() as conn:
        pass
except Exception as e:
    sqlite_db_path = os.path.join(PROJECT_ROOT, "agri_iot.db").replace("\\", "/")
    DATABASE_URL = f"sqlite:///{sqlite_db_path}"
    print(f"[DB] PostgreSQL chưa khởi chạy ({e}). Tự động sử dụng SQLite nội bộ: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency injection cung cấp session DB cho các Router FastAPI,
    tự động đóng kết nối khi xử lý xong request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



