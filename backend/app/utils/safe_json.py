import json
from decimal import Decimal
from datetime import datetime, date
import numpy as np

def safe_json_dumps(obj):
    """Safely convert Python/DB objects into JSON-serializable format."""

    def default(o):
        # Handle Decimal (MySQL, Postgres)
        if isinstance(o, Decimal):
            return float(o)

        # Handle datetime, date
        if isinstance(o, (datetime, date)):
            return o.isoformat()

        # Handle NumPy types (Excel via Pandas)
        if isinstance(o, (np.integer, np.int64)):
            return int(o)
        if isinstance(o, (np.floating, np.float64)):
            return float(o)
        if isinstance(o, np.ndarray):
            return o.tolist()

        # Fallback
        return str(o)

    return json.dumps(obj, default=default, ensure_ascii=False)
