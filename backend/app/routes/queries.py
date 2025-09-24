import os
import re
import json
import math
import logging
from typing import List, Dict, Any, Optional
import httpx

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import openai
from app.models.user import User
from app.models.query import QueryHistory, QueryRequest, QueryResponse
from app.models.database import DatabaseConnection
from app.utils.database import get_db
from app.utils.security import get_current_user
from app.utils.database_connector import DatabaseConnector
from app.utils.safe_json import safe_json_dumps

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

HF_API_URL = os.getenv("HF_API_URL", "").strip()
HF_API_KEY = os.getenv("HF_API_KEY", "").strip()

router = APIRouter(prefix="/queries", tags=["Queries"])

client = openai.OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ.get("G_KEY")
)

# ---------------------
# Safety helpers
# ---------------------
FORBIDDEN_PATTERNS = [
    r"\binsert\b", r"\bupdate\b", r"\bdelete\b", r"\bdrop\b", r"\balter\b",
    r"\btruncate\b", r"\bcreate\b", r"\bgrant\b", r"\brevoke\b", r";", r"--", r"/\*"
]

def is_select_only(sql: str) -> bool:
    return bool(sql and sql.strip().lower().startswith("select"))

def contains_forbidden(sql: str) -> bool:
    if not sql:
        return True
    low = sql.lower()
    return any(re.search(pat, low) for pat in FORBIDDEN_PATTERNS)

def enforce_limit(sql: str, limit: int = 1000) -> str:
    if re.search(r"\blimit\b", sql, flags=re.IGNORECASE):
        return sql
    return sql.rstrip() + f" LIMIT {limit}"

def extract_tables(sql: str) -> List[str]:
    if not sql:
        return []
    s = sql.lower()
    tables = re.findall(r"\bfrom\s+[`\"]?([a-z0-9_]+)[`\"]?", s)
    tables += re.findall(r"\bjoin\s+[`\"]?([a-z0-9_]+)[`\"]?", s)
    return list(set(tables))

def allowed_tables_check(sql: str, allowed_tables: List[str]) -> bool:
    found = extract_tables(sql)
    allowed_lower = [t.lower() for t in allowed_tables]
    return all(f.lower() in allowed_lower for f in found)

# ---------------------
# HuggingFace SQL generator
# ---------------------
async def hf_generate_sql(nl: str, schema: dict) -> Optional[str]:
    if not HF_API_KEY or not HF_API_URL:
        return None

    prompt = f"""
You are an expert SQL generator. Convert the following natural language query into a valid SQL SELECT query.

Schema (tables -> columns):
{json.dumps(schema, indent=2)[:4000]}

User request:
{nl}

Rules:
1. Output ONLY the SQL query, nothing else.
2. The SQL must be read-only (SELECT only).
3. Do NOT include semicolons.
4. Only reference tables/columns from the schema above.
5. If the query could return many rows, add "LIMIT 1000".
6. Prefer aggregated results for analytics when the user asks for trends/top items.
"""

    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(HF_API_URL, headers=headers, json={"inputs": prompt})
        resp.raise_for_status()
        data = resp.json()

        text = ""
        if isinstance(data, list) and data and isinstance(data[0], dict):
            text = data[0].get("generated_text") or ""
        elif isinstance(data, dict) and "generated_text" in data:
            text = data.get("generated_text") or ""
        elif isinstance(data, str):
            text = data

        # Clean ```sql ... ```
        text = text.replace("```sql", "").replace("```", "").strip()

        # If JSON was returned
        m = re.search(r"(\{[\s\S]*\})", text)
        if m:
            try:
                j = json.loads(m.group(1))
                return (j.get("sql") or "").strip()
            except Exception:
                pass

        # If raw SQL was returned
        sel = re.search(r"(select[\s\S]*)", text, flags=re.IGNORECASE)
        if sel:
            candidate = sel.group(1).strip()
            return candidate

    except Exception as e:
        logger.exception("Error calling HF model: %s", str(e))
        return None

    return None

# ---------------------
# Helper to clean NaN/inf
# ---------------------
def clean_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    def clean_val(v):
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return None
        return v
    cleaned = []
    for r in rows:
        if isinstance(r, dict):
            cleaned.append({k: clean_val(v) for k, v in r.items()})
        else:
            cleaned.append(r)
    return cleaned

# ---------------------
# Insights & chart type
# ---------------------
def generate_insight_text(nl: str, rows: List[Dict[str, Any]]) -> str:
    q = (nl or "").lower()
    if not isinstance(rows, list):
        rows = []
    if (("sales" in q or "revenue" in q) and rows):
        nums = [float(r.get("total_sales") or r.get("total_revenue") or r.get("amount") or 0) for r in rows]
        s = sum(nums)
        p = max(nums) if nums else 0
        return f"Sales summary — total: {s:,.2f}, peak: {p:,.2f}, records: {len(rows)}."
    if (("customer" in q or "user" in q) and rows):
        first = rows[0]
        if first and "total_customers" in first:
            return f"Total customers: {first['total_customers']}"
        return f"Customer dataset — {len(rows)} rows. Example: {json.dumps(first)[:120]}"
    if (("product" in q) and rows):
        top = rows[0]
        return f"Product snapshot — {len(rows)} rows. Top product: {top.get('product_name') or top.get('name') or 'N/A'}"
    if rows:
        return f"Query executed — {len(rows)} rows returned."
    return "No results found for your query."

def determine_chart_type(nl: str, rows: List[Dict[str, Any]]) -> str:
    q = (nl or "").lower()
    if any(w in q for w in ['trend', 'over time', 'last quarter']): return "line"
    if any(w in q for w in ['compare', 'top', 'by']): return "bar"
    if 'distribution' in q or 'demograph' in q or (rows and len(rows) and len(rows[0].keys()) == 2): return "pie"
    return "table"


def query_data_with_ai(user_query: str, data: dict):
    # Convert data to JSON string (but truncate if too big)
    data_json = json.dumps(data, default=str)[:5000]  # prevent token overflow
    
    # The following is a dataset (JSON format). 
    # Answer the user's question based only on the data available.
    # 2. A suggested chart type if visualization is useful (bar, line, pie, table, none).
    prompt = f"""
    You are a data analysis assistant. 
    The user will ask questions about a dataset (JON format).

    Dataset (may be truncated)::
    {data_json}

    User Query:
    {user_query}
    
    Return:
    1. A clear natural language answer.
    2. A suggested chart type if visualization is useful (bar, line, pie, table, none).
    3. Return a valid SQL query (no explanation, no markdown), and do not execute it.
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": "You are a helpful AI that analyzes tabular/JSON data."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
        response_format={ "type": "json_schema", "json_schema": {
            "name": "data_analysis_response",
            "schema": {
                "type": "object",
                "properties": {
                    "answer": { "type": "string" },
                    "suggested_chart": { "type": "string", "enum": ["bar", "line", "pie", "table", "none"] },
                    "sql_query": { "type": "string" }
                },
                "required": ["answer", "suggested_chart", "sql_query"],
                "additionalProperties": False
            }
        }}
    )

    return response.choices[0].message.content

def clean_json(obj):
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json(v) for v in obj]
    elif isinstance(obj, float):
        if obj != obj or obj in (float("inf"), float("-inf")):  # check NaN/inf
            return None
        return obj
    return obj

# ---------------------
# Route: execute
# ---------------------
@router.post("/execute")
async def execute_query(
    query_request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_connection = db.query(DatabaseConnection).filter(
        DatabaseConnection.id == query_request.database_id,
        DatabaseConnection.user_id == current_user.id,
        DatabaseConnection.is_active == True
    ).first()

    if not db_connection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database connection not found")

    connector = DatabaseConnector(db_connection)
    ok, msg = connector.connect()
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Database connection failed: {msg}")

    data = connector.get_resource_data(limit=100)
    if not data.get("success", False):
        connector.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=data.get("message", "Failed to fetch data"))
    resource = data.get("resource", {})
    print("Data from Connector: ", data)
    connector.close()
    
    ai_response = query_data_with_ai(query_request.natural_language_query, resource)
    # schema_result = connector.get_schema()
    # if not schema_result.get("success", False):
    #     connector.close()
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=schema_result.get("message", "Failed to fetch schema"))
    # schema = schema_result.get("schema", {})

    # ---------------------
    # Generate SQL
    # ---------------------
    # sql_query = None
    # if HF_API_KEY and HF_API_URL:
    #     logger.info("Using HuggingFace LLM for SQL generation")
    #     print("Schema: ", schema)
    #     sql_query = await hf_generate_sql(query_request.natural_language_query, schema)

    # if not sql_query:
    #     logger.info("LLM failed → using simple fallback")
    #     tables = list(schema.keys()) if isinstance(schema, dict) else []
    #     if tables:
    #         sql_query = f"SELECT * FROM {tables[0]} LIMIT 100"
    #     else:
    #         connector.close()
    #         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No schema available to build SQL.")

    # if not is_select_only(sql_query) or contains_forbidden(sql_query):
    #     tables = list(schema.keys()) if isinstance(schema, dict) else []
    #     if tables:
    #         sql_query = f"SELECT * FROM {tables[0]} LIMIT 100"
    #     else:
    #         connector.close()
    #         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Generated SQL failed safety checks.")

    # allowed_tables = list(schema.keys()) if isinstance(schema, dict) else []
    # if allowed_tables and not allowed_tables_check(sql_query, allowed_tables):
    #     sql_query = f"SELECT * FROM {allowed_tables[0]} LIMIT 100"

    # sql_query = enforce_limit(sql_query, limit=1000)
    
    print("AI Response: ", ai_response, type(ai_response))
    
    if isinstance(ai_response, str):
        ai_response = json.loads(ai_response)
        
    sql_query = ai_response.get("sql_query")
    rows = []
    if sql_query:
        result = connector.execute_query(sql_query)
        if result.get("success", False):
            rows = result.get("data", [])
        else:
            connector.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "SQL execution failed")
            )

    connector.close()
    
    try:
        qh = QueryHistory(
            user_id=current_user.id,
            database_id=query_request.database_id,
            query_text=sql_query,
            natural_language_query=query_request.natural_language_query,
            result=json.dumps(rows, default=str) if rows else None
        )
        db.add(qh)
        db.commit()
        db.refresh(qh)
    except Exception:
        db.rollback()
        
    print("Rows: ", rows)
    
    res_payload = {
        "success": True,
        "ai_response": ai_response,
        "sql_query": ai_response["sql_query"],
        "data": rows,
        "insights": {
            "insight_text": ai_response["answer"],
            "chart_type": ai_response["suggested_chart"]
        },
        "message": "Query executed successfully using AI"
    }
    return clean_json(res_payload)

@router.get("/history", response_model=List[QueryResponse])
def get_query_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    queries = db.query(QueryHistory).filter(
        QueryHistory.user_id == current_user.id
    ).order_by(QueryHistory.created_at.desc()).limit(50).all()
    return queries
