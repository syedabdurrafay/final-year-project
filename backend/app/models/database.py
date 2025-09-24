from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# 👇 IMPORTANT: use the shared Base from user models (same Base used in utils)
from app.models.user import Base


class DatabaseConnection(Base):
    __tablename__ = "database_connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    db_type = Column(String, nullable=False)  # excel, mysql, mongodb
    host = Column(String, nullable=True)      # Optional for Excel
    port = Column(Integer, nullable=True)     # Optional for Excel
    database_name = Column(String, nullable=True)  # Optional for Excel
    username = Column(String, nullable=True)  # Optional for Excel
    password = Column(String, nullable=True)  # Optional for Excel
    file_path = Column(String, nullable=True)  # For Excel files
    user_id = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# Pydantic models
class DatabaseConnectionCreate(BaseModel):
    name: str
    db_type: str
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    file_path: Optional[str] = None


class DatabaseConnectionResponse(BaseModel):
    id: int
    name: str
    db_type: str
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    is_active: bool
    created_at: datetime
    file_path: Optional[str] = None

    class Config:
        from_attributes = True
