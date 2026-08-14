from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import DESCENDING, ReturnDocument
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.core.dependencies import require_roles
from app.core.documents import serialize
from app.database.mongodb import get_database
from app.schemas.marketplace import BankDetailsCreate, BankDetailsUpdate

router = APIRouter(prefix="/api/cook", tags=["Cook"])


@router.post("/bank-details", status_code=status.HTTP_201_CREATED)
def create_bank_details(
    payload: BankDetailsCreate,
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> dict:
    now = datetime.now(UTC)
    document = {**payload.model_dump(), "cook_id": user["_id"], "created_at": now, "updated_at": now}
    try:
        document["_id"] = database.bank_details.insert_one(document).inserted_id
    except DuplicateKeyError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bank details already exist; update them instead") from error
    return {"success": True, "message": "Bank details created", "data": serialize(document)}


@router.get("/bank-details")
def get_bank_details(
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> dict:
    document = database.bank_details.find_one({"cook_id": user["_id"]})
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank details not found")
    return {"success": True, "data": serialize(document)}


@router.patch("/bank-details")
def update_bank_details(
    payload: BankDetailsUpdate,
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> dict:
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No bank detail changes supplied")
    changes["updated_at"] = datetime.now(UTC)
    document = database.bank_details.find_one_and_update(
        {"cook_id": user["_id"]}, {"$set": changes}, return_document=ReturnDocument.AFTER,
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank details not found")
    return {"success": True, "message": "Bank details updated", "data": serialize(document)}


@router.delete("/bank-details", status_code=status.HTTP_204_NO_CONTENT)
def delete_bank_details(
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> None:
    result = database.bank_details.delete_one({"cook_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank details not found")


@router.get("/dashboard/stats")
def dashboard_stats(
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> dict:
    """Return the signed-in home cook's headline dashboard statistics."""
    cook_id = user["_id"]
    now = datetime.now(UTC)
    month_start = datetime(now.year, now.month, 1, tzinfo=UTC)

    total_foods = database.foods.count_documents({"cook_id": cook_id})
    available_foods = database.foods.count_documents({
        "cook_id": cook_id,
        "moderation_status": "approved",
        "available": True,
        "portions": {"$gt": 0},
    })
    pending_foods = database.foods.count_documents({"cook_id": cook_id, "moderation_status": "pending"})
    sold_out_foods = database.foods.count_documents({
        "cook_id": cook_id,
        "$or": [{"available": False}, {"portions": {"$lte": 0}}],
    })

    order_pipeline = [
        {"$match": {"items.cook_id": cook_id}},
        {"$project": {
            "status": 1,
            "created_at": 1,
            "cook_items": {
                "$filter": {"input": "$items", "as": "item", "cond": {"$eq": ["$$item.cook_id", cook_id]}}
            },
        }},
        {"$project": {
            "status": 1,
            "created_at": 1,
            "cook_total": {"$sum": "$cook_items.total"},
            "cook_portions": {"$sum": "$cook_items.quantity"},
        }},
        {"$group": {
            "_id": None,
            "total_orders": {"$sum": 1},
            "pending_orders": {"$sum": {"$cond": [
                {"$in": ["$status", ["pending_cook_confirmation", "awaiting_payment", "paid", "preparing", "ready_for_delivery", "delivery_partner_assigned", "picked_up", "out_for_delivery"]]}, 1, 0
            ]}},
            "completed_orders": {"$sum": {"$cond": [{"$eq": ["$status", "delivered"]}, 1, 0]}},
            "cancelled_orders": {"$sum": {"$cond": [{"$eq": ["$status", "cancelled"]}, 1, 0]}},
            "total_earnings": {"$sum": {"$cond": [{"$eq": ["$status", "delivered"]}, "$cook_total", 0]}},
            "month_earnings": {"$sum": {"$cond": [{"$and": [
                {"$eq": ["$status", "delivered"]}, {"$gte": ["$created_at", month_start]}
            ]}, "$cook_total", 0]}},
            "portions_sold": {"$sum": {"$cond": [{"$eq": ["$status", "delivered"]}, "$cook_portions", 0]}},
        }},
        {"$project": {"_id": 0}},
    ]
    order_stats = next(database.orders.aggregate(order_pipeline), {
        "total_orders": 0,
        "pending_orders": 0,
        "completed_orders": 0,
        "cancelled_orders": 0,
        "total_earnings": 0,
        "month_earnings": 0,
        "portions_sold": 0,
    })

    rating_pipeline = [
        {"$match": {"cook_id": cook_id, "review_count": {"$gt": 0}}},
        {"$group": {
            "_id": None,
            "weighted_rating": {"$sum": {"$multiply": ["$rating", "$review_count"]}},
            "review_count": {"$sum": "$review_count"},
        }},
    ]
    rating_stats = next(database.foods.aggregate(rating_pipeline), {"weighted_rating": 0, "review_count": 0})
    review_count = rating_stats.get("review_count", 0)
    average_rating = round(rating_stats.get("weighted_rating", 0) / review_count, 2) if review_count else 0

    recent_orders = []
    cursor = database.orders.find({"items.cook_id": cook_id}).sort("created_at", DESCENDING).limit(5)
    for order in cursor:
        cook_items = [item for item in order.get("items", []) if item.get("cook_id") == cook_id]
        recent_orders.append(serialize({
            "_id": order["_id"],
            "order_number": order.get("order_number"),
            "status": order.get("status"),
            "amount": sum(item.get("total", 0) for item in cook_items),
            "item_count": sum(item.get("quantity", 0) for item in cook_items),
            "created_at": order.get("created_at"),
        }))

    return {
        "success": True,
        "data": {
            "foods": {
                "total": total_foods,
                "available": available_foods,
                "pending_approval": pending_foods,
                "sold_out": sold_out_foods,
            },
            "orders": {
                "total": order_stats["total_orders"],
                "pending": order_stats["pending_orders"],
                "completed": order_stats["completed_orders"],
                "cancelled": order_stats["cancelled_orders"],
            },
            "earnings": {
                "total": round(order_stats["total_earnings"], 2),
                "this_month": round(order_stats["month_earnings"], 2),
            },
            "portions_sold": order_stats["portions_sold"],
            "rating": {"average": average_rating, "review_count": review_count},
            "recent_orders": recent_orders,
        },
    }


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


@router.get("/orders/recent")
def recent_customer_orders(
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> dict:
    """Return recent orders with the registered customer name and this cook's items only."""
    rows = []
    cursor = database.orders.find({"items.cook_id": user["_id"]}).sort("created_at", DESCENDING).limit(10)
    for order in cursor:
        customer = database.users.find_one({"_id": order["customer_id"]}, {"full_name": 1})
        cook_items = [item for item in order.get("items", []) if item.get("cook_id") == user["_id"]]
        rows.append(serialize({
            "_id": order["_id"],
            "order_number": order.get("order_number"),
            "customer_name": customer.get("full_name", "Customer") if customer else "Customer",
            "items": cook_items,
            "status": order.get("status", "pending_cook_confirmation"),
            "payment_status": order.get("payment_status", "not_started"),
            "amount": sum(float(item.get("total", 0)) for item in cook_items),
            "created_at": order.get("created_at"),
        }))
    return {"success": True, "data": rows}


@router.get("/orders")
def all_cook_orders(user: dict = Depends(require_roles("home_cook")), database: Database = Depends(get_database)) -> dict:
    rows = []
    for order in database.orders.find({"items.cook_id": user["_id"]}).sort("created_at", DESCENDING):
        customer = database.users.find_one({"_id": order["customer_id"]}, {"full_name": 1, "phone_number": 1})
        delivery = database.deliveries.find_one({"order_id": order["_id"]})
        partner = database.delivery_partners.find_one({"_id": delivery.get("delivery_partner_id")}) if delivery and delivery.get("delivery_partner_id") else None
        item = serialize(order)
        item["customer"] = {"full_name": customer.get("full_name"), "phone": customer.get("phone_number")} if customer else None
        item["delivery_tracking"] = serialize(delivery) if delivery else None
        item["delivery_partner"] = {"full_name": partner.get("full_name"), "phone": partner.get("phone"), "vehicle_type": partner.get("vehicle_type"), "vehicle_number": partner.get("vehicle_number")} if partner else None
        rows.append(item)
    return {"success": True, "data": rows}
