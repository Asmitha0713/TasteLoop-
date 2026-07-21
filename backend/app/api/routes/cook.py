from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from pymongo.database import Database

from app.core.dependencies import require_roles
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/cook", tags=["Cook"])


@router.get("/earnings")
def earnings(
    period: str = Query(default="month", pattern="^(week|month|year)$"),
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> dict:
    now = datetime.now(UTC)
    start = {"week": now - timedelta(days=7), "month": now - timedelta(days=30), "year": now - timedelta(days=365)}[period]
    pipeline = [
        {"$match": {"status": "delivered", "created_at": {"$gte": start}, "items.cook_id": user["_id"]}},
        {"$unwind": "$items"},
        {"$match": {"items.cook_id": user["_id"]}},
        {"$group": {"_id": None, "earned": {"$sum": "$items.total"}, "orders": {"$addToSet": "$_id"}, "portions": {"$sum": "$items.quantity"}}},
        {"$project": {"_id": 0, "earned": 1, "order_count": {"$size": "$orders"}, "portions": 1}},
    ]
    summary = next(database.orders.aggregate(pipeline), {"earned": 0, "order_count": 0, "portions": 0})
    summary["average_order"] = round(summary["earned"] / summary["order_count"], 2) if summary["order_count"] else 0
    summary["period"] = period
    return {"success": True, "data": summary}
