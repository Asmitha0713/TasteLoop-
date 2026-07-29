from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pymongo import DESCENDING
from pymongo.database import Database
from pydantic import ValidationError

from app.core.dependencies import require_roles
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database
from app.schemas.marketplace import (
    ComplaintCreate, ComplaintRefundRequest, ComplaintReplacementRequest, ComplaintStatusUpdate,
)
from app.services.evidence_storage import evidence_url, store_evidence
from app.services.notification_service import create_notification
from app.services.refund_service import process_mock_refund

router = APIRouter(tags=["Complaints"])
customer_user = require_roles("customer")
admin_user = require_roles("admin")


def _complaint_view(database: Database, complaint: dict, include_private: bool = False) -> dict:
    data = serialize(complaint)
    data["evidence_image_url"] = evidence_url(complaint.get("evidence_image_url", ""))
    order = database.orders.find_one({"_id": complaint["order_id"]})
    data["order"] = serialize(order)
    if include_private:
        customer = database.users.find_one({"_id": complaint["customer_id"]}, {"password_hash": 0})
        cook = database.users.find_one({"_id": complaint["cook_id"]}, {"password_hash": 0}) if complaint.get("cook_id") else None
        data["customer"] = serialize(customer)
        data["cook"] = serialize(cook)
    return data


@router.post("/api/complaints", status_code=status.HTTP_201_CREATED)
async def create_complaint(
    order_id: str = Form(...),
    issue_type: str = Form(...),
    description: str = Form(...),
    requested_solution: str = Form(...),
    evidence_image: UploadFile = File(...),
    user: dict = Depends(customer_user),
    database: Database = Depends(get_database),
) -> dict:
    try:
        payload = ComplaintCreate(
            order_id=order_id, issue_type=issue_type, description=description,
            requested_solution=requested_solution,
        )
    except ValidationError as error:
        raise HTTPException(status_code=422, detail=error.errors(include_context=False)) from error
    order_object_id = object_id(payload.order_id, "order")
    order = database.orders.find_one({"_id": order_object_id, "customer_id": user["_id"]})
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("status") != "delivered":
        raise HTTPException(status_code=409, detail="Only delivered orders can be reported")
    duplicate = database.complaints.find_one({"order_id": order_object_id, "customer_id": user["_id"], "complaint_status": {"$ne": "rejected"}})
    if duplicate:
        raise HTTPException(status_code=409, detail="An active complaint already exists for this order")

    evidence_url = await store_evidence(evidence_image)
    now = datetime.now(UTC)
    cook_id = order.get("items", [{}])[0].get("cook_id")
    complaint = {
        "order_id": order_object_id,
        "customer_id": user["_id"],
        "cook_id": cook_id,
        "issue_type": payload.issue_type,
        "description": payload.description,
        "evidence_image_url": evidence_url,
        "requested_solution": payload.requested_solution,
        "complaint_status": "pending",
        "refund_amount": 0.0,
        "replacement_order_id": None,
        "admin_notes": None,
        "created_at": now,
        "updated_at": now,
    }
    complaint["_id"] = database.complaints.insert_one(complaint).inserted_id
    for admin in database.users.find({"role": "admin", "account_status": "active"}, {"_id": 1}):
        create_notification(
            database, admin["_id"], "complaint_submitted", "New customer complaint",
            f"A complaint was submitted for order {order['order_number']}.", order["_id"], complaint["_id"],
        )
    return {"success": True, "message": "Complaint submitted", "data": _complaint_view(database, complaint)}


@router.get("/api/complaints/my")
def my_complaints(user: dict = Depends(customer_user), database: Database = Depends(get_database)) -> dict:
    rows = database.complaints.find({"customer_id": user["_id"]}).sort("created_at", DESCENDING)
    return {"success": True, "data": [_complaint_view(database, row) for row in rows]}


@router.get("/api/complaints/{complaint_id}")
def complaint_detail(complaint_id: str, user: dict = Depends(customer_user), database: Database = Depends(get_database)) -> dict:
    complaint = database.complaints.find_one({"_id": object_id(complaint_id, "complaint"), "customer_id": user["_id"]})
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"success": True, "data": _complaint_view(database, complaint)}


@router.get("/api/admin/complaints")
def admin_complaints(user: dict = Depends(admin_user), database: Database = Depends(get_database)) -> dict:
    del user
    rows = database.complaints.find({}).sort("created_at", DESCENDING)
    return {"success": True, "data": [_complaint_view(database, row, True) for row in rows]}


@router.patch("/api/admin/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str, payload: ComplaintStatusUpdate,
    user: dict = Depends(admin_user), database: Database = Depends(get_database),
) -> dict:
    complaint_object_id = object_id(complaint_id, "complaint")
    complaint = database.complaints.find_one({"_id": complaint_object_id})
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if payload.complaint_status in {"refunded", "replacement_sent"}:
        raise HTTPException(status_code=422, detail="Use the refund or replacement action to apply this status")
    now = datetime.now(UTC)
    changes = {"complaint_status": payload.complaint_status, "updated_at": now, "updated_by": user["_id"]}
    if payload.admin_notes is not None:
        changes["admin_notes"] = payload.admin_notes
    database.complaints.update_one({"_id": complaint_object_id}, {"$set": changes})
    labels = {"under_review": "Your complaint is under review", "approved": "Your complaint was approved", "rejected": "Your complaint was rejected"}
    if payload.complaint_status in labels:
        create_notification(database, complaint["customer_id"], f"complaint_{payload.complaint_status}", labels[payload.complaint_status], payload.admin_notes or "Open My Complaints for details.", complaint["order_id"], complaint_object_id)
    updated = database.complaints.find_one({"_id": complaint_object_id})
    return {"success": True, "message": "Complaint status updated", "data": _complaint_view(database, updated, True)}


@router.post("/api/admin/complaints/{complaint_id}/refund")
def refund_complaint(
    complaint_id: str, payload: ComplaintRefundRequest,
    user: dict = Depends(admin_user), database: Database = Depends(get_database),
) -> dict:
    complaint_object_id = object_id(complaint_id, "complaint")
    complaint = database.complaints.find_one({"_id": complaint_object_id})
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.get("complaint_status") in {"rejected", "refunded", "replacement_sent"}:
        raise HTTPException(status_code=409, detail="This complaint cannot be refunded")
    order = database.orders.find_one({"_id": complaint["order_id"]})
    already_refunded = float(order.get("refund_amount", 0))
    refundable = max(0.0, round(float(order["total"]) - already_refunded, 2))
    if refundable <= 0:
        raise HTTPException(status_code=409, detail="This order has already been fully refunded")
    if payload.refund_type == "partial":
        if payload.partial_amount is None:
            raise HTTPException(status_code=422, detail="Partial refund amount is required")
        amount = round(payload.partial_amount, 2)
        if amount >= refundable:
            raise HTTPException(status_code=422, detail="Partial refund must be less than the refundable order amount")
    else:
        amount = refundable
    refund = process_mock_refund(order, amount, user["_id"])
    now = refund["processed_at"]
    database.orders.update_one({"_id": order["_id"]}, {"$set": {
        "refund_status": "refunded" if amount == refundable else "partially_refunded",
        "refund_amount": round(already_refunded + amount, 2), "refund_date": now,
        "refund_admin_id": user["_id"], "refund_processor": refund["processor"], "updated_at": now,
    }, "$push": {"refunds": refund}})
    database.complaints.update_one({"_id": complaint_object_id}, {"$set": {
        "complaint_status": "refunded", "refund_amount": amount, "refund_type": payload.refund_type,
        "admin_notes": payload.admin_notes, "refund_date": now, "refund_admin_id": user["_id"],
        "refund_processor": refund["processor"], "updated_at": now,
    }})
    create_notification(database, complaint["customer_id"], "complaint_refunded", "Refund completed", f"A {payload.refund_type} refund of Rs {amount:,.2f} was recorded for your order.", order["_id"], complaint_object_id)
    updated = database.complaints.find_one({"_id": complaint_object_id})
    return {"success": True, "message": "Refund completed using the mock refund processor", "data": _complaint_view(database, updated, True)}


@router.post("/api/admin/complaints/{complaint_id}/replacement", status_code=status.HTTP_201_CREATED)
def replace_complaint(
    complaint_id: str, payload: ComplaintReplacementRequest,
    user: dict = Depends(admin_user), database: Database = Depends(get_database),
) -> dict:
    complaint_object_id = object_id(complaint_id, "complaint")
    complaint = database.complaints.find_one({"_id": complaint_object_id})
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.get("complaint_status") in {"rejected", "refunded", "replacement_sent"}:
        raise HTTPException(status_code=409, detail="This complaint cannot receive a replacement")
    original = database.orders.find_one({"_id": complaint["order_id"]})
    if original is None:
        raise HTTPException(status_code=404, detail="Original order not found")
    for item in original["items"]:
        food = database.foods.find_one({"_id": item["food_id"]})
        if food is None or food.get("portions", 0) < item["quantity"]:
            raise HTTPException(status_code=409, detail=f"Not enough portions are available for {item['name']}")
    now = datetime.now(UTC)
    replacement_items = []
    for item in original["items"]:
        copied = dict(item)
        copied["original_unit_price"] = item.get("unit_price", 0)
        copied["unit_price"] = 0
        copied["total"] = 0
        replacement_items.append(copied)
        database.foods.update_one({"_id": item["food_id"]}, {"$inc": {"portions": -item["quantity"]}})
    replacement = {
        "order_number": f"TL-R-{uuid4().hex[:7].upper()}", "customer_id": original["customer_id"],
        "items": replacement_items, "subtotal": 0, "delivery_fee": 0, "total": 0,
        "delivery": original["delivery"], "payment_method": "replacement", "payment_status": "replacement",
        "status": "confirmed", "status_history": [{"status": "confirmed", "at": now}],
        "original_order_id": original["_id"], "complaint_id": complaint_object_id,
        "created_at": now, "updated_at": now,
    }
    replacement["_id"] = database.orders.insert_one(replacement).inserted_id
    database.complaints.update_one({"_id": complaint_object_id}, {"$set": {
        "complaint_status": "replacement_sent", "replacement_order_id": replacement["_id"],
        "admin_notes": payload.admin_notes, "updated_at": now, "updated_by": user["_id"],
    }})
    create_notification(database, complaint["customer_id"], "complaint_replacement", "Replacement order created", f"Replacement order {replacement['order_number']} has been created at no charge.", replacement["_id"], complaint_object_id)
    for cook_id in {item["cook_id"] for item in replacement_items}:
        create_notification(database, cook_id, "replacement_order", "Replacement order received", f"Replacement order {replacement['order_number']} is waiting for acceptance.", replacement["_id"], complaint_object_id)
    updated = database.complaints.find_one({"_id": complaint_object_id})
    return {"success": True, "message": "Replacement order created", "data": _complaint_view(database, updated, True)}
