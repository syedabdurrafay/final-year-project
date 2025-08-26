from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

Base = declarative_base()

class QueryHistory(Base):
    __tablename__ = "query_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    database_id = Column(Integer, nullable=False)
    query_text = Column(Text, nullable=False)
    natural_language_query = Column(Text, nullable=False)
    result = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Pydantic models
class QueryRequest(BaseModel):
    database_id: int
    natural_language_query: str

class QueryResponse(BaseModel):
    id: int
    query_text: str
    natural_language_query: str
    result: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True