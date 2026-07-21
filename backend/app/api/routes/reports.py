from datetime import UTC, datetime

from fastapi import APIRouter, Depends, status
from pymongo.database import Database

from app.core.dependencies import get_current_user
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database
from app.schemas.marketplace import ReportCreate

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, user: dict = Depends(get_current_user), database: Database = Depends(get_database)) -> dict:
    report = payload.model_dump(exclude={"against_user_id", "related_order_id", "related_food_id"})
    report.update({
        "reporter_id": user["_id"],
        "against_user_id": object_id(payload.against_user_id, "user") if payload.against_user_id else None,
        "related_order_id": object_id(payload.related_order_id, "order") if payload.related_order_id else None,
        "related_food_id": object_id(payload.related_food_id, "food") if payload.related_food_id else None,
        "status": "open", "priority": "medium", "created_at": datetime.now(UTC), "updated_at": datetime.now(UTC),
    })
    result = database.reports.insert_one(report)
    report["_id"] = result.inserted_id
    return {"success": True, "message": "Report submitted", "data": serialize(report)}
