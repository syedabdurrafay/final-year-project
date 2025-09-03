import sqlalchemy
from sqlalchemy import create_engine, text
from pymongo import MongoClient
import mysql.connector
import pandas as pd
from app.models.database import DatabaseConnection
from typing import Dict, Any, List
import json

class DatabaseConnector:
    def __init__(self, db_connection: DatabaseConnection):
        self.db_connection = db_connection
        self.connection = None
        
    def connect(self):
        try:
            if self.db_connection.db_type == "postgresql":
                connection_string = f"postgresql://{self.db_connection.username}:{self.db_connection.password}@{self.db_connection.host}:{self.db_connection.port}/{self.db_connection.database_name}"
                self.engine = create_engine(connection_string)
                self.connection = self.engine.connect()
                return True, "Connected successfully"
                
            elif self.db_connection.db_type == "mysql":
                self.connection = mysql.connector.connect(
                    host=self.db_connection.host,
                    port=self.db_connection.port,
                    user=self.db_connection.username,
                    password=self.db_connection.password,
                    database=self.db_connection.database_name
                )
                return True, "Connected successfully"
                
            elif self.db_connection.db_type == "mongodb":
                connection_string = f"mongodb://{self.db_connection.username}:{self.db_connection.password}@{self.db_connection.host}:{self.db_connection.port}/"
                self.connection = MongoClient(connection_string)
                self.db = self.connection[self.db_connection.database_name]
                return True, "Connected successfully"
                
            else:
                return False, "Unsupported database type"
                
        except Exception as e:
            return False, str(e)
    
    def execute_query(self, query: str) -> Dict[str, Any]:
        try:
            if self.db_connection.db_type in ["postgresql", "mysql"]:
                if self.db_connection.db_type == "postgresql":
                    result = self.connection.execute(text(query))
                    columns = result.keys()
                    data = result.fetchall()
                else:  # mysql
                    cursor = self.connection.cursor()
                    cursor.execute(query)
                    columns = [col[0] for col in cursor.description]
                    data = cursor.fetchall()
                    cursor.close()
                
                # Convert to list of dictionaries
                result_data = []
                for row in data:
                    result_data.append(dict(zip(columns, row)))
                
                return {
                    "success": True,
                    "data": result_data,
                    "message": "Query executed successfully"
                }
                
            elif self.db_connection.db_type == "mongodb":
                # For MongoDB, we need to parse the query differently
                # This is a simplified approach - in production, you'd need a proper query parser
                try:
                    # Try to parse as JSON
                    query_obj = json.loads(query)
                    collection_name = query_obj.get("collection")
                    filter_obj = query_obj.get("filter", {})
                    limit = query_obj.get("limit", 100)
                    
                    if not collection_name:
                        return {
                            "success": False,
                            "message": "Collection name is required for MongoDB queries"
                        }
                    
                    collection = self.db[collection_name]
                    result = list(collection.find(filter_obj).limit(limit))
                    
                    # Convert ObjectId to string for JSON serialization
                    for item in result:
                        if "_id" in item:
                            item["_id"] = str(item["_id"])
                    
                    return {
                        "success": True,
                        "data": result,
                        "message": "Query executed successfully"
                    }
                    
                except json.JSONDecodeError:
                    return {
                        "success": False,
                        "message": "For MongoDB, please provide a valid JSON query with collection and filter"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "message": f"Error executing query: {str(e)}"
            }
    
    def get_schema(self):
        try:
            if self.db_connection.db_type == "postgresql":
                # Get tables
                tables_query = """
                SELECT table_name, table_schema 
                FROM information_schema.tables 
                WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
                """
                tables_result = self.connection.execute(text(tables_query))
                tables = [dict(row) for row in tables_result]
                
                # Get columns for each table
                schema = {}
                for table in tables:
                    table_name = table['table_name']
                    schema_name = table['table_schema']
                    full_table_name = f"{schema_name}.{table_name}" if schema_name != 'public' else table_name
                    
                    columns_query = f"""
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_schema = '{schema_name}' AND table_name = '{table_name}'
                    """
                    columns_result = self.connection.execute(text(columns_query))
                    schema[full_table_name] = [dict(row) for row in columns_result]
                
                return {
                    "success": True,
                    "schema": schema,
                    "message": "Schema retrieved successfully"
                }
                
            elif self.db_connection.db_type == "mysql":
                try:
                    # Get tables
                    cursor = self.connection.cursor()
                    cursor.execute("SHOW TABLES")
                    tables = [table[0] for table in cursor.fetchall()]
                    
                    # Get columns for each table
                    schema = {}
                    for table in tables:
                        cursor.execute(f"DESCRIBE {table}")
                        columns = cursor.fetchall()
                        schema[table] = [
                            {"column_name": col[0], "data_type": col[1], "is_nullable": col[2]}
                            for col in columns
                        ]
                    
                    cursor.close()
                    return {
                        "success": True,
                        "schema": schema,
                        "message": "Schema retrieved successfully"
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"Error retrieving schema: {str(e)}"
                    }
                
            elif self.db_connection.db_type == "mongodb":
                collections = self.db.list_collection_names()
                schema = {}
                for collection in collections:
                    # Sample a few documents to infer schema
                    sample = self.db[collection].find_one()
                    if sample:
                        schema[collection] = [
                            {"field": key, "type": type(value).__name__}
                            for key, value in sample.items()
                        ]
                
                return {
                    "success": True,
                    "schema": schema,
                    "message": "Schema retrieved successfully"
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Error retrieving schema: {str(e)}"
            }
    
    def close(self):
        if self.connection:
            if self.db_connection.db_type == "postgresql":
                self.connection.close()
            elif self.db_connection.db_type == "mysql":
                self.connection.close()
            elif self.db_connection.db_type == "mongodb":
                self.connection.close()