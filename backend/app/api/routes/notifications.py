from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import DESCENDING
from pymongo.database import Database

from app.core.dependencies import get_current_user
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(
    unread_only: bool = False,
    limit: int = Query(default=30, ge=1, le=100),
    user: dict = Depends(get_current_user),
    database: Database = Depends(get_database),
) -> dict:
    filters = {"user_id": user["_id"]}
    if unread_only:
        filters["read"] = False
    notifications = [serialize(item) for item in database.notifications.find(filters).sort("created_at", DESCENDING).limit(limit)]
    unread_count = database.notifications.count_documents({"user_id": user["_id"], "read": False})
    return {"success": True, "data": notifications, "unread_count": unread_count}


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    user: dict = Depends(get_current_user),
    database: Database = Depends(get_database),
) -> dict:
    result = database.notifications.update_one(
        {"_id": object_id(notification_id, "notification"), "user_id": user["_id"]},
        {"$set": {"read": True, "read_at": datetime.now(UTC)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"success": True, "message": "Notification marked as read"}


@router.patch("/read-all")
def mark_all_notifications_read(
    user: dict = Depends(get_current_user),
    database: Database = Depends(get_database),
) -> dict:
    result = database.notifications.update_many(
        {"user_id": user["_id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.now(UTC)}},
    )
    return {"success": True, "message": "All notifications marked as read", "updated": result.modified_count}
