from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException, status


def object_id(value: str, label: str = "resource") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label.capitalize()} not found")
    return ObjectId(value)


def serialize(document: dict | None) -> dict | None:
    if document is None:
        return None
    result = dict(document)
    if "_id" in result:
        result["id"] = str(result.pop("_id"))
    for key, value in list(result.items()):
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [serialize(item) if isinstance(item, dict) else str(item) if isinstance(item, ObjectId) else item for item in value]
    result.pop("password_hash", None)
    return result
