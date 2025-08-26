from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, databases, queries
from app.config import settings
from app.utils.database import create_tables

# Create database tables
create_tables()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# CORS middleware - UPDATED with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(databases.router, prefix="/api")
app.include_router(queries.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "AI Data Analyst API is running!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "API is running"}