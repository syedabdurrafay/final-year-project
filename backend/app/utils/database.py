from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Use the SAME Base object as your user models
from app.models.user import Base

DATABASE_URL = settings.DATABASE_URL  # e.g., "sqlite:///./app.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    Import ALL models that define tables (so they register on the shared Base),
    then create all tables.
    """
    # 👇 These imports are REQUIRED so the mappers get registered on Base
    import app.models.user          # ensures user tables are known
    import app.models.database      # ensures DatabaseConnection is known

    Base.metadata.create_all(bind=engine)
