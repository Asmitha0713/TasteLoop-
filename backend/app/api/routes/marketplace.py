from fastapi import APIRouter, Depends, HTTPException
from pymongo import DESCENDING
from pymongo.database import Database

from app.core.documents import object_id, serialize
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/cooks", tags=["Marketplace"])
NON_ORDER_STATUSES = ["rejected", "cancelled"]


def _order_counts(database: Database, cook_ids: list) -> dict:
    if not cook_ids:
        return {}
    rows = database.orders.aggregate([
        {"$match": {"items.cook_id": {"$in": cook_ids}, "status": {"$nin": NON_ORDER_STATUSES}}},
        {"$unwind": "$items"},
        {"$match": {"items.cook_id": {"$in": cook_ids}}},
        {"$group": {"_id": "$items.cook_id", "order_ids": {"$addToSet": "$_id"}}},
        {"$project": {"order_count": {"$size": "$order_ids"}}},
    ])
    return {row["_id"]: row["order_count"] for row in rows}


@router.get("")
def list_cooks(database: Database = Depends(get_database)) -> dict:
    cooks = list(database.users.find({"role": "home_cook", "account_status": "active"}, {"password_hash": 0}).sort("rating", DESCENDING))
    counts = _order_counts(database, [cook["_id"] for cook in cooks])
    data = []
    for cook in cooks:
        value = serialize(cook)
        value["order_count"] = counts.get(cook["_id"], 0)
        data.append(value)
    return {"success": True, "data": data}


@router.get("/{cook_id}")
def cook_detail(cook_id: str, database: Database = Depends(get_database)) -> dict:
    cook = database.users.find_one({"_id": object_id(cook_id, "cook"), "role": "home_cook", "account_status": "active"}, {"password_hash": 0})
    if not cook:
        raise HTTPException(status_code=404, detail="Cook not found")
    data = serialize(cook)
    data["order_count"] = _order_counts(database, [cook["_id"]]).get(cook["_id"], 0)
    data["foods"] = [serialize(food) for food in database.foods.find({"cook_id": cook["_id"], "moderation_status": "approved", "available": True})]
    return {"success": True, "data": data}
