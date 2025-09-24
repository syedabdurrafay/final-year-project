# app/utils/sql_safety.py
import re
from typing import List

FORBIDDEN_KEYWORDS = [
    "insert ", "update ", "delete ", "drop ", "alter ", "create ",
    "truncate ", "grant ", "revoke ", "exec(", "execute ",
    "replace ", ";"
]

def is_select_only(sql: str) -> bool:
    if not sql or not isinstance(sql, str):
        return False
    s = sql.strip().lower()
    return s.startswith("select")

def contains_forbidden(sql: str) -> bool:
    s = sql.lower()
    for kw in FORBIDDEN_KEYWORDS:
        if kw in s:
            return True
    return False

def tables_in_sql(sql: str) -> List[str]:
    s = sql.lower()
    # crude extraction of table names after FROM / JOIN
    tables = re.findall(r'\bfrom\s+[`"]?([a-zA-Z0-9_]+)[`"]?', s)
    tables += re.findall(r'\bjoin\s+[`"]?([a-zA-Z0-9_]+)[`"]?', s)
    return list(set(tables))

def allowed_tables_check(sql: str, allowed_tables: List[str]) -> bool:
    found = tables_in_sql(sql)
    allowed_lower = [t.lower() for t in allowed_tables]
    # if no table found, be conservative and return False
    if not found:
        return False
    for f in found:
        if f.lower() not in allowed_lower:
            return False
    return True

def enforce_limit(sql: str, row_limit: int = 1000) -> str:
    # If query already has LIMIT, keep it; else append LIMIT row_limit
    if re.search(r'\blimit\b', sql, flags=re.IGNORECASE):
        return sql
    return sql.rstrip() + f" LIMIT {row_limit}"
