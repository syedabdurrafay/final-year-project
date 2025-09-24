from sqlalchemy import create_engine, text, exc
from pymongo import MongoClient, errors as mongo_errors
import mysql.connector
from mysql.connector import errorcode
import pandas as pd
import os
from app.models.database import DatabaseConnection
from typing import Dict, Any, List, Tuple
import json
import re
from urllib.parse import quote_plus


class DatabaseConnector:
    def __init__(self, db_connection: DatabaseConnection):
        self.db_connection = db_connection
        self.connection = None
        self.engine = None
        self.dataframe = None
        self.db = None
        self.current_file_path = None

    def connect(self) -> Tuple[bool, str]:
        try:
            if self.db_connection.db_type == "excel":
                if not self.db_connection.file_path:
                    return False, "Excel file path is required"

                if not os.path.exists(self.db_connection.file_path):
                    return False, f"Excel file not found at path: {self.db_connection.file_path}"

                if self.current_file_path != self.db_connection.file_path:
                    self.dataframe = pd.read_excel(self.db_connection.file_path)
                    # ✅ Clean column names here
                    self.dataframe.columns = [
                        str(col).strip().replace(" ", "_").replace("Unnamed:", "col_").lower()
                        for col in self.dataframe.columns
                    ]
                    self.current_file_path = self.db_connection.file_path

                if self.dataframe.empty:
                    return False, "Excel file is empty or contains no data"

                return True, f"Excel file loaded successfully with {len(self.dataframe.columns)} columns and {len(self.dataframe)} rows"

            elif self.db_connection.db_type == "mysql":
                if not all([self.db_connection.host, self.db_connection.port,
                           self.db_connection.database_name, self.db_connection.username]):
                    return False, "Missing required connection parameters for MySQL"

                try:
                    self.connection = mysql.connector.connect(
                        host=self.db_connection.host,
                        port=self.db_connection.port,
                        user=self.db_connection.username,
                        password=self.db_connection.password,
                        database=self.db_connection.database_name,
                        connection_timeout=10
                    )
                    cursor = self.connection.cursor()
                    cursor.execute("SELECT 1")
                    cursor.close()
                    return True, "Connected to MySQL successfully"
                except mysql.connector.Error as e:
                    if e.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                        return False, "Access denied. Please check your username and password."
                    elif e.errno == errorcode.ER_BAD_DB_ERROR:
                        return False, f"Database '{self.db_connection.database_name}' does not exist."
                    elif "2003" in str(e.errno):
                        return False, f"Cannot connect to MySQL server at {self.db_connection.host}:{self.db_connection.port}. Check if the server is running and accessible."
                    else:
                        return False, f"MySQL connection error: {str(e)}"
                except Exception as e:
                    return False, f"Unexpected MySQL connection error: {str(e)}"

            elif self.db_connection.db_type == "mongodb":
                if not all([self.db_connection.host, self.db_connection.port,
                           self.db_connection.database_name]):
                    return False, "Missing required connection parameters for MongoDB"

                try:
                    if self.db_connection.username and self.db_connection.password:
                        username = quote_plus(self.db_connection.username)
                        password = quote_plus(self.db_connection.password)
                        connection_string = f"mongodb://{username}:{password}@{self.db_connection.host}:{self.db_connection.port}/"
                    else:
                        connection_string = f"mongodb://{self.db_connection.host}:{self.db_connection.port}/"

                    self.connection = MongoClient(
                        connection_string,
                        serverSelectionTimeoutMS=10000,
                        connectTimeoutMS=10000
                    )
                    self.connection.admin.command('ismaster')
                    self.db = self.connection[self.db_connection.database_name]
                    return True, "Connected to MongoDB successfully"
                except mongo_errors.ServerSelectionTimeoutError:
                    return False, f"Cannot connect to MongoDB server at {self.db_connection.host}:{self.db_connection.port}. Check if the server is running and accessible."
                except mongo_errors.OperationFailure as e:
                    if "Authentication failed" in str(e):
                        return False, "Authentication failed. Please check your username and password."
                    else:
                        return False, f"MongoDB operation error: {str(e)}"
                except Exception as e:
                    return False, f"Unexpected MongoDB connection error: {str(e)}"

            else:
                return False, f"Unsupported database type: {self.db_connection.db_type}. Supported types: excel, mysql, mongodb"

        except Exception as e:
            return False, f"Unexpected error during connection: {str(e)}"

    def execute_query(self, query: str) -> Dict[str, Any]:
        success, message = self.connect()
        if not success:
            return {"success": False, "message": message}

        try:
            if self.db_connection.db_type == "excel":
                if not query or not query.strip():
                    return {"success": False, "message": "Query cannot be empty"}

                if self.dataframe is not None:
                    result = self.dataframe.to_dict('records')
                    return {"success": True, "data": result, "message": "Query executed successfully"}
                else:
                    return {"success": False, "message": "No data available from Excel file"}

            elif self.db_connection.db_type == "mysql":
                cursor = self.connection.cursor(dictionary=True)
                cursor.execute(query)
                data = cursor.fetchall()
                cursor.close()
                return {"success": True, "data": data, "message": "Query executed successfully"}

            elif self.db_connection.db_type == "mongodb":
                query_obj = json.loads(query)
                collection_name = query_obj.get("collection")
                filter_obj = query_obj.get("filter", {})
                limit = query_obj.get("limit", 100)
                if not collection_name:
                    return {"success": False, "message": "Collection name required"}
                collection = self.db[collection_name]
                result = list(collection.find(filter_obj).limit(limit))
                for item in result:
                    if "_id" in item:
                        item["_id"] = str(item["_id"])
                return {"success": True, "data": result, "message": "Query executed successfully"}

        except Exception as e:
            return {"success": False, "message": f"Error executing query: {str(e)}"}
        
    @staticmethod
    def normalize_column_name(name: str) -> str:
        safe = re.sub(r"[^a-zA-Z0-9_]", "_", str(name).strip())
        if safe[0].isdigit(): 
            safe = f"col_{safe}"
        return safe.lower()
    
    @staticmethod
    def normalize_type(dtype: str) -> str:
        dtype = str(dtype).lower()
        if "int" in dtype:
            return "INTEGER"
        if "float" in dtype or "double" in dtype or "numeric" in dtype or "real" in dtype:
            return "FLOAT"
        if "date" in dtype or "time" in dtype:
            return "DATE"
        if "bool" in dtype:
            return "BOOLEAN"
        return "TEXT"
    
    def get_resource_data(self, limit: int = None):
        """
        Returns the full data resource (all rows) for the connected DB.
        Optionally accepts a `limit` to avoid huge payloads.
        """
        success, message = self.connect()
        if not success:
            return {"success": False, "message": message}

        try:
            resource = {}

            if self.db_connection.db_type == "excel":
                table_name = "data"
                df = self.dataframe
                if limit:
                    df = df.head(limit)
                resource[table_name] = df.to_dict(orient="records")  # List of dicts (row-based)

            elif self.db_connection.db_type == "mysql":
                cursor = self.connection.cursor(dictionary=True)  # returns rows as dicts
                cursor.execute(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = %s",
                    (self.db_connection.database_name,)
                )
                tables = [table["TABLE_NAME"] for table in cursor.fetchall()]
                for table in tables:
                    query = f"SELECT * FROM {table}"
                    if limit:
                        query += f" LIMIT {limit}"
                    cursor.execute(query)
                    rows = cursor.fetchall()
                    resource[table] = rows
                cursor.close()

            elif self.db_connection.db_type == "mongodb":
                collections = self.db.list_collection_names()
                for collection in collections:
                    cursor = self.db[collection].find()
                    if limit:
                        cursor = cursor.limit(limit)
                    resource[collection] = list(cursor)  # convert Cursor → list of dicts

            return {
                "success": True,
                "resource": resource,
                "message": "Resource data retrieved successfully"
            }
        except Exception as e:
            return {"success": False, "message": f"Error retrieving resource data: {str(e)}"}


    def get_schema(self):
        success, message = self.connect()
        if not success:
            return {"success": False, "message": message}

        try:
            # if self.db_connection.db_type == "excel":
            #     schema = {}
            #     schema["data"] = [
            #         {"column_name": col, "data_type": str(self.dataframe[col].dtype)}
            #         for col in self.dataframe.columns
            #     ]
            #     return {"success": True, "schema": schema, "message": "Schema retrieved successfully"}

            # elif self.db_connection.db_type == "mysql":
            #     cursor = self.connection.cursor()
            #     cursor.execute(
            #         "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = %s",
            #         (self.db_connection.database_name,)
            #     )
            #     tables = [table[0] for table in cursor.fetchall()]
            #     schema = {}
            #     for table in tables:
            #         cursor.execute(
            #             "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s",
            #             (self.db_connection.database_name, table)
            #         )
            #         columns = cursor.fetchall()
            #         schema[table] = [{"column_name": col[0], "data_type": col[1]} for col in columns]
            #     cursor.close()
            #     return {"success": True, "schema": schema, "message": "Schema retrieved successfully"}

            # elif self.db_connection.db_type == "mongodb":
            #     collections = self.db.list_collection_names()
            #     schema = {}
            #     for collection in collections:
            #         sample = self.db[collection].find_one()
            #         if sample:
            #             schema[collection] = [{"field": k, "type": type(v).__name__} for k, v in sample.items()]
            #         else:
            #             schema[collection] = []
            #     return {"success": True, "schema": schema, "message": "Schema retrieved successfully"}
            schema = {}

            if self.db_connection.db_type == "excel":
                table_name = "data"  # fake table name
                schema[table_name] = [
                    {
                        "column_name": self.normalize_column_name(col),
                        "data_type": self.normalize_type(self.dataframe[col].dtype)
                    }
                    for col in self.dataframe.columns
                ]

            elif self.db_connection.db_type == "mysql":
                cursor = self.connection.cursor()
                cursor.execute(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = %s",
                    (self.db_connection.database_name,)
                )
                tables = [table[0] for table in cursor.fetchall()]
                for table in tables:
                    cursor.execute(
                        "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s",
                        (self.db_connection.database_name, table)
                    )
                    columns = cursor.fetchall()
                    schema[table] = [
                        {"column_name": self.normalize_column_name(col[0]), "data_type": self.normalize_type(col[1])}
                        for col in columns
                    ]
                cursor.close()

            elif self.db_connection.db_type == "mongodb":
                collections = self.db.list_collection_names()
                for collection in collections:
                    sample = self.db[collection].find_one()
                    if sample:
                        schema[collection] = [
                            {
                                "column_name": self.normalize_column_name(k),
                                "data_type": self.normalize_type(type(v).__name__)
                            }
                            for k, v in sample.items()
                        ]
                    else:
                        schema[collection] = []

            return {"success": True, "schema": schema, "message": "Schema retrieved successfully"}
        except Exception as e:
            return {"success": False, "message": f"Error retrieving schema: {str(e)}"}

    def close(self):
        try:
            if self.connection:
                if self.db_connection.db_type in ["mysql", "mongodb"]:
                    self.connection.close()
        except Exception:
            pass
        self.current_file_path = None
