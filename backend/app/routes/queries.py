from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import openai
import json

from app.models.user import User
from app.models.query import QueryHistory, QueryRequest, QueryResponse
from app.models.database import DatabaseConnection
from app.utils.database import get_db
from app.utils.security import decode_access_token
from app.utils.database_connector import DatabaseConnector
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

router = APIRouter(prefix="/queries", tags=["Queries"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

def generate_sql_query(natural_language_query: str, schema: dict) -> str:
    """
    Use OpenAI to generate SQL query from natural language
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenAI API key not configured"
        )

    openai.api_key = settings.OPENAI_API_KEY

    # Create prompt with schema information
    schema_info = json.dumps(schema, indent=2)

    prompt = f"""
    You are an expert SQL query generator. Based on the database schema below and the user's natural language query, generate an appropriate SQL query.

    Database Schema:
    {schema_info}

    Natural Language Query: {natural_language_query}

    Generate a valid SQL query that answers this question. Return only the SQL query without any explanations.
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates SQL queries from natural language."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.1
        )

        sql_query = response.choices[0].message.content.strip()
        # Remove any markdown code blocks if present
        if sql_query.startswith("```sql"):
            sql_query = sql_query[6:-3].strip()
        elif sql_query.startswith("```"):
            sql_query = sql_query[3:-3].strip()

        return sql_query

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating SQL query: {str(e)}"
        )

@router.post("/execute", response_model=QueryResponse)
def execute_query(
    query_request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get the database connection
    db_connection = db.query(DatabaseConnection).filter(
        DatabaseConnection.id == query_request.database_id,
        DatabaseConnection.user_id == current_user.id,
        DatabaseConnection.is_active == True
    ).first()

    if not db_connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database connection not found"
        )

    # Connect to the database
    connector = DatabaseConnector(db_connection)
    success, message = connector.connect()

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database connection failed: {message}"
        )

    # Get schema for AI query generation
    schema_result = connector.get_schema()
    if not schema_result["success"]:
        connector.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=schema_result["message"]
        )

    # Generate SQL query using AI
    try:
        sql_query = generate_sql_query(
            query_request.natural_language_query, 
            schema_result["schema"]
        )
    except Exception as e:
        connector.close()
        raise e

    # Execute the query
    result = connector.execute_query(sql_query)
    connector.close()

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    # Save the query to history
    query_history = QueryHistory(
        user_id=current_user.id,
        database_id=query_request.database_id,
        query_text=sql_query,
        natural_language_query=query_request.natural_language_query,
        result=json.dumps(result["data"]) if result["data"] else None
    )

    db.add(query_history)
    db.commit()
    db.refresh(query_history)

    return QueryResponse(
        id=query_history.id,
        query_text=sql_query,
        natural_language_query=query_request.natural_language_query,
        result=json.dumps(result["data"]) if result["data"] else None,
        created_at=query_history.created_at
    )

@router.get("/history", response_model=List[QueryResponse])
def get_query_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    queries = db.query(QueryHistory).filter(
        QueryHistory.user_id == current_user.id
    ).order_by(QueryHistory.created_at.desc()).limit(50).all()

    return queries
