import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, databases, queries, insights
from app.config import settings
from app.utils.database import create_tables

# Basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=getattr(settings, "PROJECT_NAME", "My App"),
    version=getattr(settings, "PROJECT_VERSION", "0.0.1"),
)

# 🔥 Debug CORS setup — allow all
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allow all origins
    allow_credentials=False,      # must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(databases.router, prefix="/api/databases", tags=["Databases"])
app.include_router(queries.router, prefix="/api", tags=["Queries"])
app.include_router(insights.router, prefix="/api", tags=["Insights"])

# Ensure tables exist
@app.on_event("startup")
def on_startup():
    logger.info("Creating DB tables (if not exist)...")
    create_tables()
    logger.info("Startup complete.")

# Root endpoint
@app.get("/", tags=["Root"])
def root():
    return {"message": "Backend is running with CORS enabled!"}
