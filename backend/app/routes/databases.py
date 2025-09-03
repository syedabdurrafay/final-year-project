from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.database import DatabaseConnection, DatabaseConnectionCreate, DatabaseConnectionResponse
from app.models.user import User
from app.utils.database import get_db
from app.utils.security import decode_access_token
from app.utils.database_connector import DatabaseConnector
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/databases", tags=["Databases"])
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
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

@router.post("/", response_model=DatabaseConnectionResponse)
def create_database_connection(
    db_connection: DatabaseConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if connection with same name already exists for this user
    existing_connection = db.query(DatabaseConnection).filter(
        DatabaseConnection.user_id == current_user.id,
        DatabaseConnection.name == db_connection.name,
        DatabaseConnection.is_active == True
    ).first()
    
    if existing_connection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A connection with this name already exists"
        )
    
    # Prepare connection object
    connection_obj = DatabaseConnection(
        **db_connection.dict(),
        user_id=current_user.id
    )
    
    # Test the connection
    connector = DatabaseConnector(connection_obj)
    success, message = connector.connect()
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database connection failed: {message}"
        )
    
    connector.close()
    
    # Save the connection
    db.add(connection_obj)
    db.commit()
    db.refresh(connection_obj)
    
    return connection_obj

@router.get("/", response_model=List[DatabaseConnectionResponse])
def get_database_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    connections = db.query(DatabaseConnection).filter(
        DatabaseConnection.user_id == current_user.id,
        DatabaseConnection.is_active == True
    ).all()
    
    return connections

@router.post("/test")
def test_database_connection(
    db_connection: DatabaseConnectionCreate,
    current_user: User = Depends(get_current_user)
):
    # Create a temporary connection object for testing
    connection_obj = DatabaseConnection(
        **db_connection.dict(),
        user_id=current_user.id
    )
    
    # Test the connection
    connector = DatabaseConnector(connection_obj)
    success, message = connector.connect()
    connector.close()
    
    return {
        "success": success,
        "message": message
    }

@router.get("/{db_id}/schema")
def get_database_schema(
    db_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_connection = db.query(DatabaseConnection).filter(
        DatabaseConnection.id == db_id,
        DatabaseConnection.user_id == current_user.id,
        DatabaseConnection.is_active == True
    ).first()
    
    if not db_connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database connection not found"
        )
    
    connector = DatabaseConnector(db_connection)
    success, message = connector.connect()
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database connection failed: {message}"
        )
    
    schema_result = connector.get_schema()
    connector.close()
    
    if not schema_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=schema_result["message"]
        )
    
    return schema_result

@router.delete("/{db_id}")
def delete_database_connection(
    db_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_connection = db.query(DatabaseConnection).filter(
        DatabaseConnection.id == db_id,
        DatabaseConnection.user_id == current_user.id
    ).first()
    
    if not db_connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database connection not found"
        )
    
    db_connection.is_active = False
    db.commit()
    
    return {"message": "Database connection deleted successfully"}