from datetime import UTC, datetime

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


@router.get("/dashboard")
def dashboard(_user: dict = Depends(admin_user), database: Database = Depends(get_database)) -> dict:
    pipeline = [{"$match": {"status": "delivered"}}, {"$group": {"_id": None, "revenue": {"$sum": "$total"}, "orders": {"$sum": 1}}}]
    sales = next(database.orders.aggregate(pipeline), {"revenue": 0, "orders": 0})
    return {"success": True, "data": {
        "users": database.users.count_documents({}),
        "customers": database.users.count_documents({"role": "customer"}),
        "home_cooks": database.users.count_documents({"role": "home_cook"}),
        "pending_users": database.users.count_documents({"account_status": "pending_approval"}),
        "foods": database.foods.count_documents({}),
        "pending_foods": database.foods.count_documents({"moderation_status": "pending"}),
        "open_reports": database.reports.count_documents({"status": {"$ne": "resolved"}}),
        **sales,
    }}


@router.get("/users")
def users(
    query: str | None = None, role: str | None = None, account_status: str | None = None,
    _user: dict = Depends(admin_user), database: Database = Depends(get_database),
) -> dict:
    filters: dict = {}
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
    _user: dict = Depends(admin_user), database: Database = Depends(get_database),
) -> dict:
    filters = {"status": report_status} if report_status else {}
    return {"success": True, "data": [serialize(report) for report in database.reports.find(filters).sort("created_at", DESCENDING)]}


@router.patch("/reports/{report_id}")
def update_report(report_id: str, payload: ReportUpdate, _user: dict = Depends(admin_user), database: Database = Depends(get_database)) -> dict:
    changes = payload.model_dump(exclude_none=True)
    changes["updated_at"] = datetime.now(UTC)
    result = database.reports.update_one({"_id": object_id(report_id, "report")}, {"$set": changes})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return {"success": True, "message": "Report updated"}
