import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "AI Data Analyst"
    PROJECT_VERSION: str = "1.0.0"
    
    # Use SQLite for all data (simpler setup)
    SQLITE_DB: str = os.getenv("SQLITE_DB", "sqlite:///./aianalyst.db")
    DATABASE_URL = SQLITE_DB
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
settings = Settings()