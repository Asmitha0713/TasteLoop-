from fastapi import APIRouter, Depends, HTTPException
from pymongo import DESCENDING
from pymongo.database import Database

from app.core.documents import object_id, serialize
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/cooks", tags=["Marketplace"])


@router.get("")
def list_cooks(database: Database = Depends(get_database)) -> dict:
    cooks = database.users.find({"role": "home_cook", "account_status": "active"}, {"password_hash": 0}).sort("rating", DESCENDING)
    return {"success": True, "data": [serialize(cook) for cook in cooks]}


@router.get("/{cook_id}")
def cook_detail(cook_id: str, database: Database = Depends(get_database)) -> dict:
    cook = database.users.find_one({"_id": object_id(cook_id, "cook"), "role": "home_cook", "account_status": "active"}, {"password_hash": 0})
    if not cook:
        raise HTTPException(status_code=404, detail="Cook not found")
    data = serialize(cook)
    data["foods"] = [serialize(food) for food in database.foods.find({"cook_id": cook["_id"], "moderation_status": "approved", "available": True})]
    return {"success": True, "data": data}
