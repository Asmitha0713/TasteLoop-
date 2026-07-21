from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database
from pymongo.errors import ConfigurationError, OperationFailure, ServerSelectionTimeoutError

from app.core.config import settings

client: MongoClient | None = None
database: Database | None = None


def connect_database() -> None:
    global client, database

    if not settings.mongodb_uri:
        raise RuntimeError("MONGODB_URI is not configured")
    if not settings.jwt_secret:
        raise RuntimeError("JWT_SECRET is not configured")

    client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
    except OperationFailure as error:
        client.close()
        client = None
        if error.code == 8000 or "authentication failed" in str(error).lower():
            raise RuntimeError(
                "MongoDB Atlas authentication failed. Check the database user's username and password in "
                "MONGODB_URI (Atlas Database Access, not your Atlas website login). URL-encode special "
                "characters in the password."
            ) from error
        raise RuntimeError(f"MongoDB rejected the connection: {error}") from error
    except (ConfigurationError, ServerSelectionTimeoutError) as error:
        client.close()
        client = None
        raise RuntimeError(
            "Could not connect to MongoDB. Check MONGODB_URI and allow your current IP in Atlas Network Access."
        ) from error
    database = client[settings.mongodb_db]
    database.users.create_index([("email", ASCENDING)], unique=True)
    database.users.create_index([("phone_number", ASCENDING)], unique=True)
    database.foods.create_index([("cook_id", ASCENDING), ("created_at", DESCENDING)])
    database.foods.create_index([("moderation_status", ASCENDING), ("available", ASCENDING), ("rating", DESCENDING)])
    database.carts.create_index([("customer_id", ASCENDING)], unique=True)
    database.orders.create_index([("customer_id", ASCENDING), ("created_at", DESCENDING)])
    database.orders.create_index([("cook_id", ASCENDING), ("created_at", DESCENDING)])
    database.reports.create_index([("status", ASCENDING), ("created_at", DESCENDING)])
    database.foods.create_index([("cook_id", ASCENDING)])
    database.foods.create_index([("moderation_status", ASCENDING), ("available", ASCENDING)])
    database.orders.create_index([("customer_id", ASCENDING), ("created_at", ASCENDING)])
    database.orders.create_index([("items.cook_id", ASCENDING), ("created_at", ASCENDING)])
    database.orders.create_index([("order_number", ASCENDING)], unique=True)
    database.carts.create_index([("user_id", ASCENDING)], unique=True)
    database.reports.create_index([("status", ASCENDING), ("created_at", ASCENDING)])


def close_database() -> None:
    global client, database

    if client is not None:
        client.close()
    client = None
    database = None


def get_database() -> Database:
    if database is None:
        raise RuntimeError("MongoDB is not connected")
    return database
