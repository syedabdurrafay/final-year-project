from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import httpx
import os
import logging
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.query import QueryHistory
from app.models.database import DatabaseConnection
from app.utils.database import get_db
from app.utils.security import get_current_user
from app.utils.database_connector import DatabaseConnector
from app.utils.safe_json import safe_json_dumps

router = APIRouter()
logger = logging.getLogger(__name__)

HF_API_URL = "https://api-inference.huggingface.co/models/defog/sqlcoder-7b-2"
HF_API_KEY = os.getenv("HF_API_KEY")  # ✅ Make sure it's set in your .env


class InsightRequest(BaseModel):
    query: str
    db_id: int


@router.post("/generate")
async def generate_insight(
    req: InsightRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate insights:
    1. Validate DB connection belongs to user.
    2. Fetch schema and send natural language query + schema to HuggingFace model.
    3. Execute the generated SQL on the database.
    4. Save query history.
    """
    # ✅ Validate DB belongs to current user
    db_connection = (
        db.query(DatabaseConnection)
        .filter(
            DatabaseConnection.id == req.db_id,
            DatabaseConnection.user_id == current_user.id,
            DatabaseConnection.is_active == True,
        )
        .first()
    )

    if not db_connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database connection not found",
        )

    # ✅ Connect to database
    connector = DatabaseConnector(db_connection)
    success, message = connector.connect()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection failed: {message}",
        )

    # ✅ Fetch schema
    schema_result = connector.get_schema()
    if not schema_result.get("success", False):
        connector.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to fetch schema"
        )

    schema_text = str(schema_result.get("schema", {}))

    # ✅ Improved Hugging Face Prompt
    prompt = f"""
You are an expert SQL query generator. 
Convert the following natural language request into a valid SQL SELECT statement.

Schema (tables → columns):
{schema_text}

User Request:
{req.query}

Rules:
1. Only generate a single SQL SELECT statement.
2. Do NOT use INSERT, UPDATE, DELETE, DROP, or any write operations.
3. Only use tables and columns that exist in the schema.
4. If the query is broad, include an appropriate WHERE or GROUP BY to filter or aggregate the data.
5. If no LIMIT is provided, add LIMIT 100 by default.
6. Return ONLY the SQL query as plain text (no explanations, no markdown).
"""

    # ✅ Call Hugging Face model
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                HF_API_URL,
                headers={"Authorization": f"Bearer {HF_API_KEY}"},
                json={"inputs": prompt},
            )
            response.raise_for_status()
    except httpx.RequestError as e:
        connector.close()
        logger.error(f"HuggingFace request failed: {e}")
        raise HTTPException(status_code=500, detail="HuggingFace API request failed")
    except httpx.HTTPStatusError as e:
        connector.close()
        logger.error(f"HuggingFace API error {e.response.status_code}: {e.response.text}")
        raise HTTPException(status_code=500, detail="HuggingFace API error")

    # ✅ Parse Hugging Face response
    try:
        result = response.json()
        logger.info(f"HuggingFace response: {result}")
        sql_query = (
            result[0].get("generated_text")
            or result[0].get("text")
            or result[0].get("output_text")
        )
        if not sql_query:
            raise ValueError("No valid SQL text returned from Hugging Face")
        sql_query = sql_query.strip()

        # 🧹 Remove ```sql blocks if model adds them
        sql_query = sql_query.replace("```sql", "").replace("```", "").strip()

        logger.info(f"Generated SQL: {sql_query}")
    except Exception as e:
        connector.close()
        logger.error(f"Failed to parse HuggingFace response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse HuggingFace response",
        )

    # ✅ Execute SQL
    result = connector.execute_query(sql_query)
    connector.close()

    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Query execution failed"),
        )

    # ✅ Save history (don’t fail if saving fails)
    try:
        query_history = QueryHistory(
            user_id=current_user.id,
            database_id=req.db_id,
            query_text=sql_query,
            natural_language_query=req.query,
            result=safe_json_dumps(result.get("data"))
            if result.get("data")
            else None,
        )
        db.add(query_history)
        db.commit()
        db.refresh(query_history)
    except Exception as e:
        db.rollback()
        logger.warning(f"Failed to save query history: {e}")

    return {
        "success": True,
        "sql_query": sql_query,
        "data": result.get("data", []),
        "message": "Query executed successfully",
    }
