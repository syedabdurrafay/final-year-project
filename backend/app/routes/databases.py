from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import logging
import os
import shutil
import uuid

from app.models.database import DatabaseConnection, DatabaseConnectionCreate, DatabaseConnectionResponse
from app.models.user import User
from app.utils.database import get_db
from app.utils.security import get_current_user
from app.utils.database_connector import DatabaseConnector

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Databases"])

@router.post("/", response_model=DatabaseConnectionResponse)
def create_database_connection(
    db_connection: DatabaseConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # For Excel files, validate file path exists
    if db_connection.db_type == "excel" and db_connection.file_path:
        if not os.path.exists(db_connection.file_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Excel file not found at path: {db_connection.file_path}"
            )
    
    # Validate port number for database types that use it
    if db_connection.db_type in ["mysql", "mongodb"]:
        if db_connection.port is None or db_connection.port <= 0 or db_connection.port > 65535:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid port number. Port must be between 1 and 65535."
            )
    
    # Check for duplicate connection names
    existing_connection = db.query(DatabaseConnection).filter(
        DatabaseConnection.user_id == current_user.id,
        DatabaseConnection.name == db_connection.name,
        DatabaseConnection.is_active == True
    ).first()

    if existing_connection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A connection with this name already exists. Please choose a different name."
        )

    connection_obj = DatabaseConnection(
        **db_connection.dict(),
        user_id=current_user.id
    )

    # Test the connection before saving
    connector = DatabaseConnector(connection_obj)
    success, message = connector.connect()

    if not success:
        logger.warning(f"Database connection failed for user {current_user.id}: {message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection failed: {message}"
        )

    connector.close()

    # Save the connection
    try:
        db.add(connection_obj)
        db.commit()
        db.refresh(connection_obj)
        logger.info(f"Database connection created successfully for user {current_user.id}: {connection_obj.name}")
        return connection_obj
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving database connection for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save connection. Please try again."
        )

@router.post("/excel", response_model=DatabaseConnectionResponse)
async def create_excel_connection(
    file: UploadFile = File(...),
    name: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    
    # Generate unique filename to avoid conflicts
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_path = f"uploads/{unique_filename}"
    
    try:
        # Save the file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Check for duplicate connection names
        existing_connection = db.query(DatabaseConnection).filter(
            DatabaseConnection.user_id == current_user.id,
            DatabaseConnection.name == name,
            DatabaseConnection.is_active == True
        ).first()

        if existing_connection:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A connection with this name already exists. Please choose a different name."
            )

        # Create a temporary connection object for testing
        test_connection = DatabaseConnection(
            name=name,
            db_type="excel",
            file_path=file_path,
            user_id=current_user.id
        )

        # Test the connection before saving
        connector = DatabaseConnector(test_connection)
        success, message = connector.connect()

        if not success:
            logger.warning(f"Excel connection failed for user {current_user.id}: {message}")
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connection failed: {message}"
            )

        connector.close()

        # Create the actual connection object to save
        connection_obj = DatabaseConnection(
            name=name,
            db_type="excel",
            file_path=file_path,
            user_id=current_user.id
        )

        # Save the connection
        try:
            db.add(connection_obj)
            db.commit()
            db.refresh(connection_obj)
            logger.info(f"Excel connection created successfully for user {current_user.id}: {connection_obj.name}")
            return connection_obj
        except Exception as e:
            db.rollback()
            os.remove(file_path)
            logger.error(f"Error saving Excel connection for user {current_user.id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save connection. Please try again."
            )
            
    except Exception as e:
        # Clean up file if something went wrong
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Unexpected error in create_excel_connection: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )

@router.get("/", response_model=List[DatabaseConnectionResponse])
def get_database_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return db.query(DatabaseConnection).filter(
            DatabaseConnection.user_id == current_user.id,
            DatabaseConnection.is_active == True
        ).all()
    except Exception as e:
        logger.error(f"Error retrieving database connections for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve connections. Please try again."
        )

@router.post("/test")
def test_database_connection(
    db_connection: DatabaseConnectionCreate,
    current_user: User = Depends(get_current_user)
):
    # For Excel files, validate file path exists
    if db_connection.db_type == "excel" and db_connection.file_path:
        if not os.path.exists(db_connection.file_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Excel file not found at path: {db_connection.file_path}"
            )
    
    # Validate port number for database types that use it
    if db_connection.db_type in ["mysql", "mongodb"]:
        if db_connection.port is None or db_connection.port <= 0 or db_connection.port > 65535:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid port number. Port must be between 1 and 65535."
            )
    
    connection_obj = DatabaseConnection(
        **db_connection.dict(),
        user_id=current_user.id
    )

    connector = DatabaseConnector(connection_obj)
    success, message = connector.connect()
    
    # Get schema if connection is successful
    schema = None
    if success:
        schema_result = connector.get_schema()
        if schema_result["success"]:
            schema = schema_result.get("schema", {})
    
    connector.close()

    return {"success": success, "message": message, "schema": schema}

@router.post("/test-excel")
async def test_excel_connection(
    file: UploadFile = File(...),
    name: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    # Save the file temporarily
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        # Test the Excel connection
        db_connection = DatabaseConnectionCreate(
            name=name,
            db_type="excel",
            file_path=file_path
        )
        
        connection_obj = DatabaseConnection(
            **db_connection.dict(),
            user_id=current_user.id
        )

        connector = DatabaseConnector(connection_obj)
        success, message = connector.connect()
        
        if success:
            # Get schema information
            schema_result = connector.get_schema()
            connector.close()
            
            # Clean up temporary file
            os.remove(file_path)
            
            return {
                "success": success, 
                "message": message,
                "schema": schema_result.get("schema", {})
            }
        else:
            print("Excel connection failed: ", success, message)
            connector.close()
            os.remove(file_path)
            return {"success": success, "message": message}
            
    except Exception as e:
        # Clean up temporary file if it exists
        print("Error testing excel: ", str(e))
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error testing Excel connection: {str(e)}"
        )

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
            detail="Database connection not found or you don't have permission to access it."
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
            detail="Database connection not found or you don't have permission to delete it."
        )

    try:
        # If it's an Excel connection, delete the file too
        if db_connection.db_type == "excel" and db_connection.file_path and os.path.exists(db_connection.file_path):
            os.remove(db_connection.file_path)
            
        db_connection.is_active = False
        db.commit()
        logger.info(f"Database connection deleted by user {current_user.id}: {db_connection.name}")
        return {"message": "Database connection deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting database connection for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete database connection. Please try again."
        )