import re
from datetime import UTC, datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pymongo import DESCENDING, ReturnDocument
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.core.dependencies import require_approved_delivery_partner, require_roles
from app.core.documents import object_id, serialize
from app.core.security import hash_password
from app.database.mongodb import get_database
from app.schemas.auth import RegisterRequest
from app.schemas.delivery import (
    AvailabilityUpdate, DeliveryAssignment, DeliveryProfileUpdate, DeliveryRegistrationData,
    DeliveryStatusUpdate, PartnerAccountStatusUpdate, PartnerApprovalUpdate,
)
from app.services.image_storage import storage_url, store_image
from app.services.notification_service import create_notification

router = APIRouter(tags=["Delivery Partners"])


def _partner_public(partner: dict | None) -> dict | None:
    if not partner:
        return None
    return {
        "id": str(partner["_id"]), "full_name": partner.get("full_name"), "phone": partner.get("phone"),
        "profile_image": storage_url(partner.get("profile_image")), "has_vehicle": partner.get("has_vehicle"), "vehicle_type": partner.get("vehicle_type"),
        "vehicle_number": partner.get("vehicle_number"), "availability": partner.get("availability"),
    }


def _delivery_view(database: Database, delivery: dict, include_private: bool = False) -> dict:
    value = serialize(delivery)
    order = database.orders.find_one({"_id": delivery["order_id"]})
    if order:
        value["order"] = serialize(order)
        customer = database.users.find_one({"_id": order["customer_id"]}, {"password_hash": 0})
        cook_id = delivery.get("home_cook_id") or next((i.get("cook_id") for i in order.get("items", [])), None)
        cook = database.users.find_one({"_id": cook_id}, {"password_hash": 0}) if cook_id else None
        value["customer"] = {"full_name": customer.get("full_name"), "phone": customer.get("phone_number")} if customer else None
        value["home_cook"] = {"full_name": cook.get("full_name"), "phone": cook.get("phone_number")} if cook else None
    partner = database.delivery_partners.find_one({"_id": delivery.get("delivery_partner_id")}) if delivery.get("delivery_partner_id") else None
    value["delivery_partner"] = serialize(partner) if include_private and partner else _partner_public(partner)
    if value.get("delivery_partner") and include_private:
        value["delivery_partner"]["profile_image"] = storage_url(partner.get("profile_image"))
    return value


@router.post("/api/delivery-partners/register", status_code=status.HTTP_201_CREATED)
async def register_delivery_partner(
    full_name: str = Form(...), email: str = Form(...), password: str = Form(...), confirm_password: str = Form(...),
    phone: str = Form(...), address: str = Form(...), has_vehicle: str = Form(...),
    vehicle_type: str | None = Form(default=None), vehicle_number: str | None = Form(default=None),
    licence_number: str = Form(...), nic_number: str = Form(...), bank_name: str = Form(...),
    bank_account_name: str = Form(...), bank_account_number: str = Form(...), bank_branch: str = Form(...),
    profile_image: UploadFile | None = File(default=None), driving_licence_image: UploadFile = File(...),
    database: Database = Depends(get_database),
) -> dict:
    if password != confirm_password:
        raise HTTPException(status_code=422, detail="Password and confirm password do not match")
    RegisterRequest.validate_password(password)
    phone = re.sub(r"[\s()-]", "", phone)
    data = DeliveryRegistrationData(
        full_name=full_name, email=email, password=password, phone=phone, address=address,
        has_vehicle=has_vehicle, vehicle_type=vehicle_type, vehicle_number=vehicle_number, licence_number=licence_number,
        nic_number=nic_number, bank_name=bank_name, bank_account_name=bank_account_name,
        bank_account_number=bank_account_number, bank_branch=bank_branch,
    )
    if data.has_vehicle == "yes" and (not data.vehicle_type or not data.vehicle_number):
        raise HTTPException(status_code=422, detail="Vehicle type and vehicle number are required when you have a vehicle")
    if database.users.find_one({"$or": [{"email": data.email}, {"phone_number": data.phone}]}):
        raise HTTPException(status_code=409, detail="Email or phone number already exists")
    image_path = await store_image(profile_image, "delivery-partners", "Profile image") if profile_image else None
    licence_image_path = await store_image(driving_licence_image, "delivery-partners/licences", "Driving licence image")
    now = datetime.now(UTC)
    user = {
        "full_name": data.full_name.strip(), "email": data.email, "phone_number": data.phone,
        "password_hash": hash_password(password), "role": "delivery_partner", "account_status": "pending_approval",
        "approval_status": "pending", "created_at": now, "updated_at": now,
    }
    try:
        user_id = database.users.insert_one(user).inserted_id
        partner = {
            "user_id": user_id, "full_name": user["full_name"], "phone": data.phone, "address": data.address,
            "profile_image": image_path, "has_vehicle": data.has_vehicle,
            "vehicle_type": data.vehicle_type if data.has_vehicle == "yes" else None,
            "vehicle_number": data.vehicle_number if data.has_vehicle == "yes" else None,
            "licence_number": data.licence_number, "licence_image": licence_image_path, "nic_number": data.nic_number,
            "bank_details": {"bank_name": data.bank_name, "account_name": data.bank_account_name,
                             "account_number": data.bank_account_number, "branch": data.bank_branch},
            "availability": "offline", "approval_status": "pending", "status": "active",
            "total_deliveries": 0, "total_earnings": 0.0, "created_at": now, "updated_at": now,
        }
        partner_id = database.delivery_partners.insert_one(partner).inserted_id
        for admin in database.users.find({"role": "admin", "account_status": "active"}, {"_id": 1}):
            create_notification(database, admin["_id"], "delivery_partner_application", "New Delivery Partner application", f"{user['full_name']} submitted an application for approval.", partner_id)
    except DuplicateKeyError as error:
        raise HTTPException(status_code=409, detail="Email or phone number already exists") from error
    return {"success": True, "message": "Application submitted. You can log in after Admin approval.", "data": {"id": str(partner_id), "approval_status": "pending"}}


@router.get("/api/delivery-partners/profile")
def delivery_profile(user: dict = Depends(require_approved_delivery_partner)) -> dict:
    partner = user["delivery_partner"].copy()
    partner["profile_image"] = storage_url(partner.get("profile_image"))
    partner.pop("bank_details", None); partner.pop("nic_number", None); partner.pop("licence_number", None)
    return {"success": True, "data": serialize(partner)}


@router.patch("/api/delivery-partners/profile")
def update_delivery_profile(payload: DeliveryProfileUpdate, user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No profile changes supplied")
    ownership = changes.get("has_vehicle", user["delivery_partner"].get("has_vehicle", "no"))
    if ownership == "yes" and not (changes.get("vehicle_type", user["delivery_partner"].get("vehicle_type")) and changes.get("vehicle_number", user["delivery_partner"].get("vehicle_number"))):
        raise HTTPException(status_code=422, detail="Vehicle type and vehicle number are required when you have a vehicle")
    if ownership == "no":
        changes.update({"vehicle_type": None, "vehicle_number": None})
    changes["updated_at"] = datetime.now(UTC)
    database.delivery_partners.update_one({"_id": user["delivery_partner"]["_id"]}, {"$set": changes})
    if "phone" in changes:
        database.users.update_one({"_id": user["_id"]}, {"$set": {"phone_number": changes["phone"], "updated_at": changes["updated_at"]}})
    return {"success": True, "message": "Delivery profile updated"}


@router.patch("/api/delivery-partners/availability")
def update_availability(payload: AvailabilityUpdate, user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    database.delivery_partners.update_one({"_id": user["delivery_partner"]["_id"]}, {"$set": {"availability": payload.availability, "updated_at": datetime.now(UTC)}})
    return {"success": True, "message": f"You are now {payload.availability}"}


@router.patch("/api/delivery-partners/profile/image")
async def update_delivery_profile_image(
    profile_image: UploadFile = File(...), user: dict = Depends(require_approved_delivery_partner),
    database: Database = Depends(get_database),
) -> dict:
    image_path = await store_image(profile_image, "delivery-partners", "Profile image")
    database.delivery_partners.update_one({"_id": user["delivery_partner"]["_id"]}, {"$set": {"profile_image": image_path, "updated_at": datetime.now(UTC)}})
    return {"success": True, "message": "Profile image updated", "data": {"profile_image": storage_url(image_path)}}


@router.get("/api/delivery-partners/dashboard")
def delivery_dashboard(user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    partner = user["delivery_partner"]; now = datetime.now(UTC); today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    active = ["delivery_assigned", "arrived_at_pickup", "picked_up", "out_for_delivery"]
    earnings = list(database.deliveries.aggregate([{"$match": {"delivery_partner_id": partner["_id"], "status": {"$in": ["delivered", "completed"]}}}, {"$group": {"_id": None, "total": {"$sum": "$delivery_fee"}, "count": {"$sum": 1}}}]))
    totals = earnings[0] if earnings else {"total": 0, "count": 0}
    today_rows = list(database.deliveries.aggregate([{"$match": {"delivery_partner_id": partner["_id"], "delivered_at": {"$gte": today}}}, {"$group": {"_id": None, "total": {"$sum": "$delivery_fee"}, "count": {"$sum": 1}}}]))
    day = today_rows[0] if today_rows else {"total": 0, "count": 0}
    available_filter = {"status": "ready_for_pickup", "delivery_partner_id": None}
    return {"success": True, "data": {"availability": partner["availability"], "available_deliveries": database.deliveries.count_documents(available_filter) if partner["availability"] == "online" else 0, "active_deliveries": database.deliveries.count_documents({"delivery_partner_id": partner["_id"], "status": {"$in": active}}), "today_completed": day["count"], "total_completed": totals["count"], "today_earnings": day["total"], "total_earnings": totals["total"]}}


@router.get("/api/delivery-partners/deliveries/available")
def available_deliveries(user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    partner = user["delivery_partner"]
    if partner["availability"] != "online":
        return {"success": True, "data": []}
    rows = database.deliveries.find({"$or": [{"status": "ready_for_pickup", "delivery_partner_id": None}, {"status": "delivery_assigned", "delivery_partner_id": partner["_id"]}]}).sort("created_at", DESCENDING)
    return {"success": True, "data": [_delivery_view(database, row) for row in rows]}


@router.get("/api/delivery-partners/deliveries/active")
def active_deliveries(user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    rows = database.deliveries.find({"delivery_partner_id": user["delivery_partner"]["_id"], "status": {"$in": ["delivery_assigned", "arrived_at_pickup", "picked_up", "out_for_delivery"]}}).sort("assigned_at", DESCENDING)
    return {"success": True, "data": [_delivery_view(database, row) for row in rows]}


@router.get("/api/delivery-partners/deliveries/history")
def delivery_history(user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    rows = database.deliveries.find({"delivery_partner_id": user["delivery_partner"]["_id"], "status": {"$in": ["delivered", "completed", "cancelled", "rejected"]}}).sort("updated_at", DESCENDING)
    return {"success": True, "data": [_delivery_view(database, row) for row in rows]}


@router.get("/api/delivery-partners/earnings")
def delivery_earnings(user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    now = datetime.now(UTC); today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    rows = list(database.deliveries.find({"delivery_partner_id": user["delivery_partner"]["_id"], "status": {"$in": ["delivered", "completed"]}}).sort("delivered_at", DESCENDING))
    def amount_after(start): return sum(float(row.get("delivery_fee", 0)) for row in rows if row.get("delivered_at", row.get("updated_at", now)) >= start)
    return {"success": True, "data": {"today": amount_after(today), "weekly": amount_after(now - timedelta(days=7)), "monthly": amount_after(now - timedelta(days=30)), "total": sum(float(r.get("delivery_fee", 0)) for r in rows), "history": [dict(serialize(r), payout_status=r.get("payout_status", "pending")) for r in rows]}}


@router.post("/api/deliveries/{delivery_id}/accept")
def accept_delivery(delivery_id: str, user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    partner = user["delivery_partner"]
    if partner["availability"] != "online": raise HTTPException(status_code=409, detail="Go online before accepting deliveries")
    now = datetime.now(UTC); oid = object_id(delivery_id, "delivery")
    delivery = database.deliveries.find_one_and_update({"_id": oid, "$or": [{"status": "ready_for_pickup", "delivery_partner_id": None}, {"status": "delivery_assigned", "delivery_partner_id": partner["_id"]}]}, {"$set": {"delivery_partner_id": partner["_id"], "status": "delivery_assigned", "accepted_at": now, "assigned_at": now, "updated_at": now}}, return_document=ReturnDocument.AFTER)
    if not delivery: raise HTTPException(status_code=409, detail="Delivery is no longer available")
    database.orders.update_one({"_id": delivery["order_id"]}, {"$set": {"status": "delivery_assigned", "updated_at": now}, "$push": {"status_history": {"status": "delivery_assigned", "at": now}}})
    create_notification(database, delivery["customer_id"], "delivery_assigned", "Delivery Partner assigned", f"{partner['full_name']} will deliver your order.", delivery["order_id"])
    create_notification(database, delivery["home_cook_id"], "delivery_accepted", "Delivery accepted", f"{partner['full_name']} accepted the pickup request.", delivery["order_id"])
    return {"success": True, "message": "Delivery accepted", "data": _delivery_view(database, delivery)}


@router.post("/api/deliveries/{delivery_id}/reject")
def reject_delivery(delivery_id: str, user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    delivery = database.deliveries.find_one_and_update({"_id": object_id(delivery_id, "delivery"), "delivery_partner_id": user["delivery_partner"]["_id"], "status": "delivery_assigned"}, {"$set": {"delivery_partner_id": None, "status": "ready_for_pickup", "updated_at": datetime.now(UTC)}}, return_document=ReturnDocument.AFTER)
    if not delivery: raise HTTPException(status_code=409, detail="This delivery cannot be rejected")
    database.orders.update_one({"_id": delivery["order_id"]}, {"$set": {"status": "ready_for_pickup", "updated_at": datetime.now(UTC)}})
    return {"success": True, "message": "Delivery rejected"}


@router.patch("/api/deliveries/{delivery_id}/status")
def update_delivery_status(delivery_id: str, payload: DeliveryStatusUpdate, user: dict = Depends(require_approved_delivery_partner), database: Database = Depends(get_database)) -> dict:
    transitions = {"delivery_assigned": "arrived_at_pickup", "arrived_at_pickup": "picked_up", "picked_up": "out_for_delivery", "out_for_delivery": "delivered"}
    delivery = database.deliveries.find_one({"_id": object_id(delivery_id, "delivery"), "delivery_partner_id": user["delivery_partner"]["_id"]})
    if not delivery: raise HTTPException(status_code=404, detail="Delivery not found")
    if transitions.get(delivery["status"]) != payload.status: raise HTTPException(status_code=409, detail=f"Delivery cannot move from {delivery['status']} to {payload.status}")
    now = datetime.now(UTC); changes = {"status": payload.status, "updated_at": now, f"{payload.status}_at": now}
    database.deliveries.update_one({"_id": delivery["_id"]}, {"$set": changes, "$push": {"status_history": {"status": payload.status, "at": now}}})
    if payload.status == "delivered":
        database.delivery_partners.update_one({"_id": user["delivery_partner"]["_id"]}, {"$inc": {"total_deliveries": 1, "total_earnings": float(delivery.get("delivery_fee", 0))}, "$set": {"updated_at": now}})
    order_status = payload.status if payload.status != "arrived_at_pickup" else "delivery_assigned"
    database.orders.update_one({"_id": delivery["order_id"]}, {"$set": {"status": order_status, "updated_at": now}, "$push": {"status_history": {"status": order_status, "at": now}}})
    create_notification(database, delivery["customer_id"], f"delivery_{payload.status}", "Delivery update", f"Your order is now {payload.status.replace('_', ' ')}.", delivery["order_id"])
    if payload.status in {"picked_up", "delivered"}:
        create_notification(database, delivery["home_cook_id"], f"delivery_{payload.status}", "Delivery update", f"Order delivery is now {payload.status.replace('_', ' ')}.", delivery["order_id"])
    return {"success": True, "message": "Delivery status updated"}


@router.get("/api/admin/delivery-partners")
def admin_partners(_user: dict = Depends(require_roles("admin")), database: Database = Depends(get_database)) -> dict:
    rows = []
    for partner in database.delivery_partners.find().sort("created_at", DESCENDING):
        partner["profile_image"] = storage_url(partner.get("profile_image"))
        partner["licence_image"] = storage_url(partner.get("licence_image"))
        rows.append(serialize(partner))
    return {"success": True, "data": rows}


@router.get("/api/admin/delivery-partners/{partner_id}")
def admin_partner(partner_id: str, _user: dict = Depends(require_roles("admin")), database: Database = Depends(get_database)) -> dict:
    partner = database.delivery_partners.find_one({"_id": object_id(partner_id, "delivery partner")})
    if not partner: raise HTTPException(status_code=404, detail="Delivery Partner not found")
    partner["profile_image"] = storage_url(partner.get("profile_image"))
    partner["licence_image"] = storage_url(partner.get("licence_image"))
    return {"success": True, "data": serialize(partner)}


@router.patch("/api/admin/delivery-partners/{partner_id}/approval")
def approve_partner(partner_id: str, payload: PartnerApprovalUpdate, admin: dict = Depends(require_roles("admin")), database: Database = Depends(get_database)) -> dict:
    partner = database.delivery_partners.find_one({"_id": object_id(partner_id, "delivery partner")})
    if not partner: raise HTTPException(status_code=404, detail="Delivery Partner not found")
    now = datetime.now(UTC); account = "active" if payload.approval_status == "approved" else "rejected"
    database.delivery_partners.update_one({"_id": partner["_id"]}, {"$set": {"approval_status": payload.approval_status, "admin_notes": payload.admin_notes, "approved_by": admin["_id"], "updated_at": now}})
    database.users.update_one({"_id": partner["user_id"]}, {"$set": {"approval_status": payload.approval_status, "account_status": account, "updated_at": now}})
    return {"success": True, "message": f"Delivery Partner {payload.approval_status}"}


@router.patch("/api/admin/delivery-partners/{partner_id}/status")
def partner_status(partner_id: str, payload: PartnerAccountStatusUpdate, _user: dict = Depends(require_roles("admin")), database: Database = Depends(get_database)) -> dict:
    partner = database.delivery_partners.find_one({"_id": object_id(partner_id, "delivery partner")})
    if not partner: raise HTTPException(status_code=404, detail="Delivery Partner not found")
    now = datetime.now(UTC); database.delivery_partners.update_one({"_id": partner["_id"]}, {"$set": {"status": payload.status, "availability": "offline" if payload.status == "suspended" else partner.get("availability", "offline"), "updated_at": now}})
    database.users.update_one({"_id": partner["user_id"]}, {"$set": {"account_status": payload.status, "updated_at": now}})
    return {"success": True, "message": f"Delivery Partner {payload.status}"}


@router.post("/api/admin/orders/{order_id}/assign-delivery-partner")
def assign_partner(order_id: str, payload: DeliveryAssignment, _user: dict = Depends(require_roles("admin")), database: Database = Depends(get_database)) -> dict:
    order = database.orders.find_one({"_id": object_id(order_id, "order"), "status": "ready_for_pickup"})
    partner = database.delivery_partners.find_one({"_id": object_id(payload.delivery_partner_id, "delivery partner"), "approval_status": "approved", "status": "active", "availability": "online"})
    if not order: raise HTTPException(status_code=409, detail="Order is not ready for pickup")
    if not partner: raise HTTPException(status_code=409, detail="Delivery Partner is not approved, active, and online")
    now = datetime.now(UTC)
    delivery = database.deliveries.find_one_and_update({"order_id": order["_id"], "status": "ready_for_pickup"}, {"$set": {"delivery_partner_id": partner["_id"], "status": "delivery_assigned", "assigned_at": now, "updated_at": now}}, return_document=ReturnDocument.AFTER)
    if not delivery: raise HTTPException(status_code=409, detail="Delivery is no longer available")
    database.orders.update_one({"_id": order["_id"]}, {"$set": {"status": "delivery_assigned", "updated_at": now}, "$push": {"status_history": {"status": "delivery_assigned", "at": now}}})
    create_notification(database, partner["user_id"], "delivery_request", "New delivery assigned", f"Order {order['order_number']} is ready for pickup.", order["_id"])
    return {"success": True, "message": "Delivery Partner assigned", "data": _delivery_view(database, delivery)}


@router.get("/api/admin/deliveries")
def admin_deliveries(_user: dict = Depends(require_roles("admin")), database: Database = Depends(get_database)) -> dict:
    return {"success": True, "data": [_delivery_view(database, d, include_private=False) for d in database.deliveries.find().sort("created_at", DESCENDING)]}
