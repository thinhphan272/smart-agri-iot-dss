import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = os.getenv(

    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/agri_iot_db"
)

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)


engine = create_engine(DATABASE_URL, echo=False)


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



