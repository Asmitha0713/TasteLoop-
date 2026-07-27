from datetime import UTC, datetime


def create_notification(
    database,
    user_id,
    notification_type: str,
    title: str,
    message: str,
    order_id=None,
) -> dict:
    document = {
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "order_id": order_id,
        "read": False,
        "created_at": datetime.now(UTC),
    }
    document["_id"] = database.notifications.insert_one(document).inserted_id
    return document
