from datetime import UTC, datetime
from uuid import uuid4

import stripe
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pymongo import DESCENDING, ReturnDocument
from pymongo.database import Database

from app.core.dependencies import require_roles
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database
from app.integrations.stripe_payment import amount_minor_units, configured as stripe_configured, construct_webhook_event, create_payment_intent, webhook_configured
from app.core.config import settings
from app.schemas.marketplace import CheckoutRequest, OrderStatusUpdate
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/orders", tags=["Orders"])
DELIVERY_FEE = 200
MIXED_COOK_MESSAGE = "Your cart already contains food from another cook. Please clear the cart before adding this item."
COOK_STATUS_TRANSITIONS = {
    "pending_cook_confirmation": {"rejected"},
    "paid": {"preparing"},
    "preparing": {"ready_for_delivery"},
}


def _with_delivery(database: Database, order: dict) -> dict:
    value = serialize(order)
    delivery = database.deliveries.find_one({"order_id": order["_id"]})
    if delivery:
        value["delivery_tracking"] = serialize(delivery)
        partner = database.delivery_partners.find_one({"_id": delivery.get("delivery_partner_id")}) if delivery.get("delivery_partner_id") else None
        if partner:
            value["delivery_partner"] = {"id": str(partner["_id"]), "full_name": partner.get("full_name"), "phone": partner.get("phone"), "vehicle_type": partner.get("vehicle_type"), "vehicle_number": partner.get("vehicle_number")}
    return value


@router.post("", status_code=status.HTTP_201_CREATED)
def checkout(payload: CheckoutRequest, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    cart = database.carts.find_one({"customer_id": user["_id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")
    order_items = []
    subtotal = 0.0
    for cart_item in cart["items"]:
        food = database.foods.find_one({"_id": cart_item["food_id"], "moderation_status": "approved", "available": True})
        quantity = cart_item["quantity"]
        if food is None or food["portions"] < quantity:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="One or more cart items are no longer available")
        item_total = food["price"] * quantity
        subtotal += item_total
        order_items.append({
            "food_id": food["_id"], "cook_id": food["cook_id"], "name": food["name"],
            "quantity": quantity, "unit_price": food["price"], "total": item_total,
            "emoji": food.get("emoji", "🍽️"), "color": food.get("color", "#f4dfb8"), "image_url": food.get("image_url"),
        })
    if len({item["cook_id"] for item in order_items}) != 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=MIXED_COOK_MESSAGE)
    now = datetime.now(UTC)
    order = {
        "order_number": f"TL-{uuid4().hex[:8].upper()}", "customer_id": user["_id"],
        "items": order_items, "subtotal": subtotal, "delivery_fee": DELIVERY_FEE,
        "total": subtotal + DELIVERY_FEE, "delivery": payload.model_dump(exclude={"payment_method"}),
        "payment_method": "card", "payment_status": "not_started", "payment_provider": "stripe",
        "status": "pending_cook_confirmation",
        "status_history": [{"status": "pending_cook_confirmation", "at": now}],
        "created_at": now, "updated_at": now,
    }
    result = database.orders.insert_one(order)
    order["_id"] = result.inserted_id
    for item in order_items:
        database.foods.update_one({"_id": item["food_id"]}, {"$inc": {"portions": -item["quantity"]}})
    database.carts.delete_one({"customer_id": user["_id"]})
    for cook_id in {item["cook_id"] for item in order_items}:
        create_notification(database, cook_id, "new_order", "New order received", f"Order {order['order_number']} is waiting for your confirmation.", order["_id"])
    return {"success": True, "message": "Waiting for Home Cook confirmation.", "data": serialize(order)}


@router.post("/{order_id}/payment-intent")
def start_payment(order_id: str, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    if not stripe_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe card payments are not configured yet")
    order = database.orders.find_one({"_id": object_id(order_id, "order"), "customer_id": user["_id"]})
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.get("status") != "awaiting_payment" or order.get("payment_status") not in {"not_started", "pending"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment is available only after the Home Cook accepts the order")
    try:
        intent = create_payment_intent(order, user)
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe payment could not be started. Please try again.") from error
    now = datetime.now(UTC)
    database.orders.update_one(
        {"_id": order["_id"], "status": "awaiting_payment"},
        {"$set": {"stripe_payment_intent_id": intent.id, "payment_status": "pending", "updated_at": now}},
    )
    return {"success": True, "message": "Complete payment to continue", "payment": {"provider": "stripe", "client_secret": intent.client_secret, "publishable_key": settings.stripe_publishable_key, "payment_intent_id": intent.id}}


@router.post("/stripe/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, database: Database = Depends(get_database)) -> Response:
    if not stripe_configured() or not webhook_configured():
        return Response(status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    try:
        event = construct_webhook_event(payload, signature)
    except (ValueError, RuntimeError, stripe.SignatureVerificationError):
        return Response(status_code=status.HTTP_400_BAD_REQUEST)
    event_type = event["type"]
    if event_type not in {"payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled"}:
        return Response(status_code=status.HTTP_200_OK)
    intent = event["data"]["object"]
    order = database.orders.find_one({"stripe_payment_intent_id": intent.get("id"), "payment_method": "card"})
    if order is None:
        return Response(status_code=status.HTTP_200_OK)
    if str(intent.get("currency", "")).lower() != "lkr" or intent.get("amount") != amount_minor_units(order["total"]):
        return Response(status_code=status.HTTP_400_BAD_REQUEST)
    now = datetime.now(UTC)
    is_paid = event_type == "payment_intent.succeeded" and intent.get("status") == "succeeded"
    if is_paid and order.get("payment_status") != "paid" and order.get("status") == "awaiting_payment":
        updated = database.orders.update_one({"_id": order["_id"], "status": "awaiting_payment", "payment_status": "pending"}, {"$set": {"payment_status": "paid", "status": "paid", "payment_provider": "stripe", "payment_id": intent.get("id"), "paid_at": now, "updated_at": now}, "$push": {"status_history": {"status": "paid", "at": now}}})
        if updated.modified_count:
            for cook_id in {item["cook_id"] for item in order["items"]}:
                create_notification(database, cook_id, "payment_received", "Payment received", "Payment received. Please prepare the order.", order["_id"])
    elif event_type == "payment_intent.canceled" and order.get("payment_status") == "pending":
        database.orders.update_one({"_id": order["_id"], "status": "awaiting_payment"}, {"$set": {"payment_status": "not_started", "updated_at": now}, "$unset": {"stripe_payment_intent_id": ""}})
    return Response(status_code=status.HTTP_200_OK)


@router.get("/{order_id}/payment")
def payment_status(order_id: str, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    order = database.orders.find_one({"_id": object_id(order_id, "order"), "customer_id": user["_id"]})
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.get("payment_status") == "pending" and order.get("stripe_payment_intent_id") and settings.stripe_secret_key:
        try:
            stripe.api_key = settings.stripe_secret_key
            intent = stripe.PaymentIntent.retrieve(order["stripe_payment_intent_id"])
            valid_payment = (
                intent.status == "succeeded"
                and str(intent.currency).lower() == "lkr"
                and intent.amount == amount_minor_units(order["total"])
                and intent.metadata["order_id"] == str(order["_id"])
            )
            if valid_payment:
                now = datetime.now(UTC)
                updated = database.orders.update_one(
                    {"_id": order["_id"], "status": "awaiting_payment", "payment_status": "pending"},
                    {
                        "$set": {"payment_status": "paid", "status": "paid", "payment_provider": "stripe", "payment_id": intent.id, "paid_at": now, "updated_at": now},
                        "$push": {"status_history": {"status": "paid", "at": now}},
                    },
                )
                if updated.modified_count:
                    for cook_id in {item["cook_id"] for item in order["items"]}:
                        create_notification(database, cook_id, "payment_received", "Payment received", "Payment received. Please prepare the order.", order["_id"])
                order["payment_status"] = "paid"
                order["status"] = "paid"
        except stripe.StripeError:
            # Webhook processing remains the primary production verification path.
            pass
    return {"success": True, "data": {"order_id": str(order["_id"]), "order_number": order["order_number"], "payment_status": order["payment_status"], "status": order["status"], "total": order["total"]}}


@router.post("/{order_id}/payment/cancel")
def cancel_card_payment(order_id: str, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    order = database.orders.find_one({"_id": object_id(order_id, "order"), "customer_id": user["_id"], "status": "awaiting_payment", "payment_method": "card", "payment_status": "pending"})
    if order is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This payment can no longer be cancelled")
    try:
        stripe.api_key = settings.stripe_secret_key
        stripe.PaymentIntent.cancel(order["stripe_payment_intent_id"])
    except stripe.StripeError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe could not cancel this payment") from error
    now = datetime.now(UTC)
    database.orders.update_one({"_id": order["_id"], "status": "awaiting_payment", "payment_status": "pending"}, {"$set": {"payment_status": "not_started", "updated_at": now}, "$unset": {"stripe_payment_intent_id": ""}})
    return {"success": True, "message": "Payment cancelled. You can try again."}


@router.get("/{order_id}")
def order_detail(order_id: str, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    order = database.orders.find_one({"_id": object_id(order_id, "order"), "customer_id": user["_id"]})
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return {"success": True, "data": _with_delivery(database, order)}


@router.get("")
def my_orders(
    order_status: str | None = Query(default=None, alias="status"),
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> dict:
    filters: dict = {"customer_id": user["_id"]}
    if order_status:
        filters["status"] = order_status
    return {"success": True, "data": [_with_delivery(database, order) for order in database.orders.find(filters).sort("created_at", DESCENDING)]}


@router.get("/cook")
def cook_orders(user: dict = Depends(require_roles("home_cook")), database: Database = Depends(get_database)) -> dict:
    orders = database.orders.find({"items.cook_id": user["_id"]}).sort("created_at", DESCENDING)
    return {"success": True, "data": [_with_delivery(database, order) for order in orders]}


@router.post("/{order_id}/accept")
def accept_order(
    order_id: str,
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> dict:
    order_object_id = object_id(order_id, "order")
    now = datetime.now(UTC)
    order = database.orders.find_one_and_update(
        {"_id": order_object_id, "items.cook_id": user["_id"], "status": "pending_cook_confirmation"},
        {"$set": {"status": "awaiting_payment", "accepted_at": now, "updated_at": now}, "$push": {"status_history": {"$each": [{"status": "cook_accepted", "at": now}, {"status": "awaiting_payment", "at": now}]}}},
        return_document=ReturnDocument.AFTER,
    )
    if order is None:
        owned_order = database.orders.find_one({"_id": order_object_id, "items.cook_id": user["_id"]})
        if owned_order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending orders can be accepted")
    create_notification(
        database, order["customer_id"], "order_accepted", "Order accepted",
        "Your order has been accepted successfully. Please complete the payment.", order["_id"],
    )
    return {"success": True, "message": "Order accepted. Waiting for customer payment.", "data": serialize(order)}


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: str, payload: OrderStatusUpdate,
    user: dict = Depends(require_roles("home_cook")), database: Database = Depends(get_database),
) -> dict:
    filters: dict = {"_id": object_id(order_id, "order"), "items.cook_id": user["_id"]}
    order = database.orders.find_one(filters)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    allowed = COOK_STATUS_TRANSITIONS.get(order.get("status"), set())
    if payload.status not in allowed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Order cannot move from {order.get('status')} to {payload.status}")
    if payload.status == "preparing" and order.get("payment_status") != "paid":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment must be completed before preparation starts")
    filters["status"] = order["status"]
    now = datetime.now(UTC)
    result = database.orders.update_one(filters, {"$set": {"status": payload.status, "updated_at": now}, "$push": {"status_history": {"status": payload.status, "at": now}}})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    updated_order = database.orders.find_one({"_id": filters["_id"]})
    if payload.status == "ready_for_delivery" and updated_order:
        cook_id = next((item.get("cook_id") for item in updated_order.get("items", []) if item.get("cook_id") == user.get("_id")), None)
        delivery_address = updated_order.get("delivery", {})
        database.deliveries.update_one(
            {"order_id": updated_order["_id"]},
            {"$setOnInsert": {"order_id": updated_order["_id"], "delivery_partner_id": None, "home_cook_id": cook_id,
             "customer_id": updated_order["customer_id"], "pickup_address": user.get("address") or user.get("location") or "Contact Home Cook",
             "delivery_address": delivery_address.get("address", ""), "delivery_fee": updated_order.get("delivery_fee", 0),
             "estimated_distance_km": None, "estimated_arrival_minutes": None,
             "status": "ready_for_delivery", "assigned_at": None, "accepted_at": None, "picked_up_at": None,
             "delivered_at": None, "status_history": [{"status": "ready_for_delivery", "at": now}], "created_at": now, "updated_at": now}},
            upsert=True,
        )
        for partner in database.delivery_partners.find({"approval_status": "approved", "status": "active", "availability": "online"}, {"user_id": 1}):
            create_notification(database, partner["user_id"], "food_ready", "New delivery available", f"Order {updated_order['order_number']} is ready for delivery.", updated_order["_id"])
    notification_copy = {
        "preparing": ("Order is being prepared", "Your home cook has started preparing your meal."),
        "ready_for_delivery": ("Order is ready for delivery", "Your meal is waiting for a Delivery Partner."),
        "rejected": ("Order rejected", "Your order was rejected by the Home Cook."),
    }
    if payload.status in notification_copy and updated_order:
        title, message = notification_copy[payload.status]
        create_notification(
            database, updated_order["customer_id"], f"order_{payload.status}", title,
            f"{message} Order {updated_order['order_number']}", updated_order["_id"],
        )
    if payload.status == "rejected" and updated_order and not updated_order.get("inventory_restored"):
        for item in updated_order["items"]:
            database.foods.update_one({"_id": item["food_id"]}, {"$inc": {"portions": item["quantity"]}})
        database.orders.update_one({"_id": updated_order["_id"]}, {"$set": {"inventory_restored": True}})
    return {"success": True, "message": "Order status updated", "data": serialize(updated_order)}


@router.post("/{order_id}/confirm-received")
def confirm_received(order_id: str, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    now = datetime.now(UTC)
    order = database.orders.find_one_and_update(
        {"_id": object_id(order_id, "order"), "customer_id": user["_id"], "status": "delivered"},
        {"$set": {"customer_confirmed_received_at": now, "updated_at": now}},
        return_document=ReturnDocument.AFTER,
    )
    if not order: raise HTTPException(status_code=409, detail="Only delivered orders can be confirmed")
    database.deliveries.update_one({"order_id": order["_id"], "status": "delivered"}, {"$set": {"customer_confirmed_received_at": now, "updated_at": now}})
    return {"success": True, "message": "Order receipt confirmed", "data": serialize(order)}


@router.get("/admin/all")
def admin_orders(_user: dict = Depends(require_roles("admin")), database: Database = Depends(get_database)) -> dict:
    rows = []
    for order in database.orders.find().sort("created_at", DESCENDING):
        value = _with_delivery(database, order)
        customer = database.users.find_one({"_id": order["customer_id"]}, {"password_hash": 0})
        cook_id = next((item.get("cook_id") for item in order.get("items", [])), None)
        cook = database.users.find_one({"_id": cook_id}, {"password_hash": 0}) if cook_id else None
        value["customer"] = serialize(customer) if customer else None
        value["home_cook"] = serialize(cook) if cook else None
        rows.append(value)
    return {"success": True, "data": rows}
