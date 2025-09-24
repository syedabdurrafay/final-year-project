# app/utils/llm.py
import os
import re
import json
import logging
from typing import Dict, Any, Optional

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

logger = logging.getLogger(__name__)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    ch.setFormatter(fmt)
    logger.addHandler(ch)
logger.setLevel(logging.INFO)

# -------------------------
# Load model & tokenizer once
# -------------------------
MODEL_NAME = os.getenv("HF_MODEL_NAME", "defog/sqlcoder-7b-2")

logger.info(f"Loading Hugging Face model locally: {MODEL_NAME} ...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)
logger.info("Model loaded successfully.")

# -------------------------
# Helper: clean output text
# -------------------------
_code_block_re = re.compile(r"```(?:sql|json)?\n([\s\S]*?)```", flags=re.IGNORECASE)
def strip_code_block(text: str) -> str:
    if not text:
        return text
    m = _code_block_re.search(text)
    if m:
        return m.group(1).strip()
    return text.strip()

def repair_json_text(text: str) -> Optional[dict]:
    if not text:
        return None
    s = re.sub(r"```(?:json)?", "", text, flags=re.IGNORECASE).replace("```", "")
    s = re.sub(r"//.*?$|/\*[\s\S]*?\*/", "", s, flags=re.MULTILINE)
    s = re.sub(r",\s*([}\]])", r"\1", s)
    s = s.strip()
    try:
        return json.loads(s)
    except Exception as e:
        logger.debug("repair_json_text failed: %s | cleaned: %s", e, s[:200])
        return None

# -------------------------
# Low-level local generation
# -------------------------
def generate_local(prompt: str, max_new_tokens: int = 512, temperature: float = 0.0) -> str:
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    outputs = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        temperature=temperature,
        do_sample=(temperature > 0),
        pad_token_id=tokenizer.eos_token_id
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# -------------------------
# Public: generate SQL from NL
# -------------------------
async def generate_sql_from_nl(nl_query: str, schema: Dict[str, Any]) -> Dict[str, Optional[str]]:
    schema_text = json.dumps(schema, indent=2) if isinstance(schema, dict) else str(schema)
    schema_snippet = schema_text[:3500]

    prompt = f"""
You are an expert SQL generator. Given a database schema and a user's natural language request, output ONLY a MySQL-compatible SELECT query (no explanation, no markdown, no backticks). Do NOT output ';'.

Schema:
{schema_snippet}

User request:
{nl_query}

If the request is vague or cannot be mapped to the schema, output exactly:
GUIDANCE: Try asking about [list of table names and columns]
"""

    try:
        txt = generate_local(prompt, max_new_tokens=512, temperature=0.0)
    except Exception as e:
        logger.error("Local model failed for SQL generation: %s", e)
        return {"sql": None, "guidance": None}

    logger.info("Model returned raw SQL text: %s", (txt[:500] if txt else None))
    t = strip_code_block(txt)

    if not t:
        return {"sql": None, "guidance": None}

    if t.strip().lower().startswith("guidance:"):
        guidance = t.split(":", 1)[1].strip()
        return {"sql": None, "guidance": guidance}

    jmatch = re.search(r"(\{[\s\S]*\})", t)
    if jmatch:
        repaired = repair_json_text(jmatch.group(1))
        if repaired and repaired.get("sql"):
            return {"sql": repaired.get("sql").strip(), "guidance": None}

    sel = re.search(r"((?:with\s+[\s\S]*?)?select[\s\S]*)", t, flags=re.IGNORECASE)
    if sel:
        sql = sel.group(1).strip().split("\n\n")[0].strip().rstrip(";")
        return {"sql": sql, "guidance": None}

    return {"sql": None, "guidance": None}

# -------------------------
# Public: generate Mongo query from NL
# -------------------------
async def generate_mongo_query_from_nl(nl_query: str, schema: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    collections = list(schema.keys()) if isinstance(schema, dict) else []
    collections_snippet = ", ".join(collections[:50])

    prompt = f"""
You are an expert at converting natural language requests into MongoDB find queries.
Schema collections: {collections_snippet}

User request:
{nl_query}

Output RULES:
- Return ONLY a valid JSON object with keys: "collection" (string), "filter" (object), optional "limit" (number).
- Use field names from the schema. If unsure, pick the most likely collection.
- If request is vague, return: {{"guidance": "Try asking about <list of collections>"}}
Example:
{{"collection":"orders","filter":{{"status":"paid","amount":{{"$gt":100}}}},"limit":100}}
"""

    try:
        txt = generate_local(prompt, max_new_tokens=350, temperature=0.0)
    except Exception as e:
        logger.error("Local model failed for Mongo generation: %s", e)
        return None

    logger.info("Model returned raw Mongo text: %s", (txt[:500] if txt else None))
    t = strip_code_block(txt)

    if t.strip().lower().startswith("guidance"):
        return None

    m = re.search(r"(\{[\s\S]*\})", t)
    if m:
        parsed = repair_json_text(m.group(1))
        if parsed and parsed.get("collection"):
            if "limit" in parsed:
                try:
                    parsed["limit"] = int(parsed["limit"])
                except Exception:
                    parsed["limit"] = 100
            else:
                parsed["limit"] = 100
            return parsed

    return None

# -------------------------
# Public: insights from rows
# -------------------------
async def generate_insight_from_rows(nl_query: str, sql_query: str, rows: list) -> Dict[str, Any]:
    top_rows = json.dumps(rows[:10], default=str)
    prompt = f"""
You are a helpful data analyst.
Summarize the SQL/Mongo query result and suggest a visualization.

User request: {nl_query}
SQL executed: {sql_query}
Top rows: {top_rows}

Return JSON only with keys:
- insight_text: short summary
- chart_type: one of ["line", "bar", "pie", "table"]
- highlights: optional short notes
"""
    try:
        txt = generate_local(prompt, max_new_tokens=300, temperature=0.0)
        t = strip_code_block(txt)
        m = re.search(r"(\{[\s\S]*\})", t)
        if m:
            parsed = repair_json_text(m.group(1))
            if isinstance(parsed, dict):
                if parsed.get("chart_type") not in ("line", "bar", "pie", "table"):
                    parsed["chart_type"] = "table"
                return parsed
    except Exception as e:
        logger.warning("Local model failed for insights: %s", e)

    count = len(rows) if isinstance(rows, list) else 0
    return {
        "insight_text": f"Query returned {count} rows.",
        "chart_type": "table",
        "highlights": ""
    }
