from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import DESCENDING
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.core.dependencies import require_roles
from app.core.documents import object_id, serialize
from app.core.security import hash_password
from app.database.mongodb import get_database
from app.schemas.marketplace import AdminUserCreate, AccountStatusUpdate, FoodModerationUpdate, ReportUpdate

router = APIRouter(prefix="/api/admin", tags=["Admin"])
admin_user = require_roles("admin")


@router.get("/analytics/reports-revenue")
def reports_revenue_analytics(
    period: str = Query(default="month", pattern="^(week|month|year)$"),
    _user: dict = Depends(admin_user),
    database: Database = Depends(get_database),
) -> dict:
    now = datetime.now(UTC)
    start = {"week": now - timedelta(days=7), "month": now - timedelta(days=30), "year": now - timedelta(days=365)}[period]
    date_format = "%Y-%m" if period == "year" else "%Y-%m-%d"

    revenue_pipeline = [
        {"$match": {"status": "delivered", "created_at": {"$gte": start, "$lte": now}}},
        {"$facet": {
            "summary": [{"$group": {
                "_id": None, "gross_revenue": {"$sum": "$total"},
                "order_count": {"$sum": 1}, "average_order_value": {"$avg": "$total"},
            }}],
            "series": [
                {"$group": {
                    "_id": {"$dateToString": {"format": date_format, "date": "$created_at", "timezone": "UTC"}},
                    "revenue": {"$sum": "$total"}, "orders": {"$sum": 1},
                }},
                {"$sort": {"_id": 1}},
            ],
        }},
    ]
    revenue_result = next(database.orders.aggregate(revenue_pipeline), {"summary": [], "series": []})
    revenue = revenue_result.get("summary", [{}])[0] if revenue_result.get("summary") else {}
    series = [{"date": item["_id"], "revenue": round(item["revenue"], 2), "orders": item["orders"]} for item in revenue_result.get("series", [])]

    order_statuses = {
        row["_id"]: row["count"] for row in database.orders.aggregate([
            {"$match": {"created_at": {"$gte": start, "$lte": now}}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ])
    }
    report_rows = list(database.reports.aggregate([
        {"$match": {"created_at": {"$gte": start, "$lte": now}}},
        {"$facet": {
            "by_status": [{"$group": {"_id": "$status", "count": {"$sum": 1}}}],
            "by_type": [{"$group": {"_id": "$report_type", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}],
            "high_priority": [{"$match": {"priority": "high", "status": {"$ne": "resolved"}}}, {"$count": "count"}],
            "total": [{"$count": "count"}],
        }},
    ]))
    report_result = report_rows[0] if report_rows else {}
    by_status = {row["_id"]: row["count"] for row in report_result.get("by_status", [])}

    return {"success": True, "data": {
        "period": period,
        "from": start.isoformat(),
        "to": now.isoformat(),
        "revenue": {
            "gross": round(revenue.get("gross_revenue", 0), 2),
            "delivered_orders": revenue.get("order_count", 0),
            "average_order_value": round(revenue.get("average_order_value", 0), 2),
            "series": series,
        },
        "orders_by_status": order_statuses,
        "reports": {
            "total": report_result.get("total", [{}])[0].get("count", 0) if report_result.get("total") else 0,
            "open": by_status.get("open", 0),
            "investigating": by_status.get("investigating", 0),
            "resolved": by_status.get("resolved", 0),
            "high_priority_open": report_result.get("high_priority", [{}])[0].get("count", 0) if report_result.get("high_priority") else 0,
            "by_type": [{"type": row["_id"], "count": row["count"]} for row in report_result.get("by_type", [])],
        },
    }}


@router.get("/dashboard")
def dashboard(_user: dict = Depends(admin_user), database: Database = Depends(get_database)) -> dict:
    pipeline = [{"$match": {"status": "delivered"}}, {"$group": {"_id": None, "revenue": {"$sum": "$total"}, "orders": {"$sum": 1}}}]
    sales = next(database.orders.aggregate(pipeline), {"revenue": 0, "orders": 0})
    return {"success": True, "data": {
        "users": database.users.count_documents({}),
        "customers": database.users.count_documents({"role": "customer"}),
        "home_cooks": database.users.count_documents({"role": "home_cook"}),
        "delivery_partners": database.users.count_documents({"role": "delivery_partner"}),
        "pending_delivery_partners": database.delivery_partners.count_documents({"approval_status": "pending"}),
        "pending_users": database.users.count_documents({"account_status": "pending_approval"}),
        "foods": database.foods.count_documents({}),
        "pending_foods": database.foods.count_documents({"moderation_status": "pending"}),
        "open_reports": database.reports.count_documents({"status": {"$in": ["open", "investigating"]}}),
        **sales,
    }}


@router.get("/users")
def users(
    query: str | None = None, role: str | None = None, account_status: str | None = None,
    _user: dict = Depends(admin_user), database: Database = Depends(get_database),
) -> dict:
    filters: dict = {"account_status": {"$ne": "deleted"}}
    if query:
        filters["$or"] = [{"full_name": {"$regex": query, "$options": "i"}}, {"email": {"$regex": query, "$options": "i"}}]
    if role:
        filters["role"] = role
    if account_status:
        filters["account_status"] = account_status
    return {"success": True, "data": [serialize(user) for user in database.users.find(filters, {"password_hash": 0}).sort("created_at", DESCENDING)]}


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(payload: AdminUserCreate, _user: dict = Depends(admin_user), database: Database = Depends(get_database)) -> dict:
    now = datetime.now(UTC)
    document = payload.model_dump(exclude={"password"})
    document.update({"email": str(payload.email).lower(), "password_hash": hash_password(payload.password), "created_at": now, "updated_at": now})
    try:
        result = database.users.insert_one(document)
    except DuplicateKeyError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or phone number already exists") from error
    document["_id"] = result.inserted_id
    return {"success": True, "message": "User created", "data": serialize(document)}


@router.patch("/users/{user_id}/status")
def change_user_status(user_id: str, payload: AccountStatusUpdate, _user: dict = Depends(admin_user), database: Database = Depends(get_database)) -> dict:
    result = database.users.update_one({"_id": object_id(user_id, "user")}, {"$set": {"account_status": payload.account_status, "updated_at": datetime.now(UTC)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"success": True, "message": "User status updated"}


@router.delete("/users/{user_id}")
def remove_user(
    user_id: str,
    current_admin: dict = Depends(admin_user),
    database: Database = Depends(get_database),
) -> dict:
    target_id = object_id(user_id, "user")
    if target_id == current_admin["_id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot remove your own admin account")

    user = database.users.find_one({"_id": target_id, "account_status": {"$ne": "deleted"}})
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    active_statuses = [
        "pending_cook_confirmation", "cook_accepted", "awaiting_payment", "paid",
        "preparing", "ready_for_delivery", "delivery_partner_assigned", "picked_up", "out_for_delivery", "delivered",
    ]
    order_filter: dict = {"status": {"$in": active_statuses}}
    if user.get("role") == "customer":
        order_filter["customer_id"] = target_id
    elif user.get("role") == "home_cook":
        order_filter["items.cook_id"] = target_id
    else:
        order_filter = {}
    if order_filter and database.orders.find_one(order_filter, {"_id": 1}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user has an active order. Complete or cancel it before removing the account.",
        )

    partner = database.delivery_partners.find_one({"user_id": target_id}, {"_id": 1})
    if partner and database.deliveries.find_one({
        "delivery_partner_id": partner["_id"],
        "status": {"$nin": ["delivered", "completed", "cancelled", "rejected"]},
    }, {"_id": 1}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This delivery partner has an active delivery. Complete or reassign it before removing the account.",
        )

    now = datetime.now(UTC)
    database.users.update_one({"_id": target_id}, {"$set": {
        "full_name": "Deleted User",
        "email": f"deleted-{target_id}@deleted.tasteloop.local",
        "phone_number": f"deleted-{target_id}",
        "password_hash": "",
        "account_status": "deleted",
        "deleted_at": now,
        "deleted_by": current_admin["_id"],
        "updated_at": now,
    }})
    database.refresh_tokens.delete_many({"user_id": target_id})
    database.carts.delete_many({"$or": [{"customer_id": target_id}, {"user_id": target_id}]})
    database.addresses.delete_many({"user_id": target_id})
    database.favorites.delete_many({"user_id": target_id})
    database.notifications.delete_many({"user_id": target_id})
    database.bank_details.delete_many({"cook_id": target_id})
    database.delivery_partners.delete_many({"user_id": target_id})
    if user.get("role") == "home_cook":
        database.foods.update_many({"cook_id": target_id}, {"$set": {"is_active": False, "updated_at": now}})
    return {"success": True, "message": "User removed successfully"}


@router.get("/foods")
def foods(
    moderation_status: str | None = Query(default=None, alias="status"),
    _user: dict = Depends(admin_user), database: Database = Depends(get_database),
) -> dict:
    filters = {"moderation_status": moderation_status} if moderation_status else {}
    return {"success": True, "data": [serialize(food) for food in database.foods.find(filters).sort("created_at", DESCENDING)]}


@router.patch("/foods/{food_id}/moderation")
def moderate_food(food_id: str, payload: FoodModerationUpdate, _user: dict = Depends(admin_user), database: Database = Depends(get_database)) -> dict:
    result = database.foods.update_one({"_id": object_id(food_id, "food")}, {"$set": {"moderation_status": payload.moderation_status, "updated_at": datetime.now(UTC)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
    return {"success": True, "message": "Food moderation status updated"}


@router.get("/reports")
def reports(
    report_status: str | None = Query(default=None, alias="status"),
    active_only: bool = False,
    _user: dict = Depends(admin_user), database: Database = Depends(get_database),
) -> dict:
    filters = {"status": report_status} if report_status else {}
    if active_only and not report_status:
        filters["status"] = {"$in": ["open", "investigating"]}
    return {"success": True, "data": [serialize(report) for report in database.reports.find(filters).sort("created_at", DESCENDING)]}


@router.patch("/reports/{report_id}")
def update_report(report_id: str, payload: ReportUpdate, _user: dict = Depends(admin_user), database: Database = Depends(get_database)) -> dict:
    changes = payload.model_dump(exclude_none=True)
    changes["updated_at"] = datetime.now(UTC)
    result = database.reports.update_one({"_id": object_id(report_id, "report")}, {"$set": changes})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return {"success": True, "message": "Report updated"}
