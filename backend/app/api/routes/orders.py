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
DELIVERY_FEE = 300
MIXED_COOK_MESSAGE = "Your cart already contains food from another cook. Please clear the cart before adding this item."
COOK_STATUS_TRANSITIONS = {
    "confirmed": {"accepted", "rejected", "cancelled"},
    "pending": {"accepted", "rejected", "cancelled"},
    "accepted": {"preparing", "cancelled"},
    "preparing": {"ready_for_pickup", "ready", "cancelled"},
    "ready": {"ready_for_pickup"},
    "delivered": set(),
    "cancelled": set(),
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
    if payload.payment_method == "card" and not stripe_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe card payments are not configured yet")
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
        "payment_method": payload.payment_method, "payment_status": "pending" if payload.payment_method == "card" else "cash_on_delivery",
        "payment_provider": "stripe" if payload.payment_method == "card" else "cash",
        "status": "payment_pending" if payload.payment_method == "card" else "confirmed",
        "status_history": [{"status": "payment_pending" if payload.payment_method == "card" else "confirmed", "at": now}],
        "created_at": now, "updated_at": now,
    }
    result = database.orders.insert_one(order)
    order["_id"] = result.inserted_id
    stripe_intent = None
    if payload.payment_method == "card":
        try:
            stripe_intent = create_payment_intent(order, user)
        except Exception as error:
            database.orders.delete_one({"_id": order["_id"]})
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe Checkout could not be started. Please try again.") from error
        database.orders.update_one({"_id": order["_id"]}, {"$set": {"stripe_payment_intent_id": stripe_intent.id, "updated_at": datetime.now(UTC)}})
        order["stripe_payment_intent_id"] = stripe_intent.id
    for item in order_items:
        database.foods.update_one({"_id": item["food_id"]}, {"$inc": {"portions": -item["quantity"]}})
    database.carts.delete_one({"customer_id": user["_id"]})
    if payload.payment_method == "cash":
        for cook_id in {item["cook_id"] for item in order_items}:
            create_notification(
                database, cook_id, "new_order", "New order received",
                f"Order {order['order_number']} is waiting for your acceptance.", order["_id"],
            )
    response = {"success": True, "message": "Order placed successfully", "data": serialize(order)}
    if payload.payment_method == "card":
        response["message"] = "Enter your card details to complete payment"
        response["payment"] = {"provider": "stripe", "client_secret": stripe_intent.client_secret, "publishable_key": settings.stripe_publishable_key, "payment_intent_id": stripe_intent.id}
    return response


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
    if is_paid and order.get("payment_status") != "paid":
        database.orders.update_one({"_id": order["_id"]}, {"$set": {"payment_status": "paid", "status": "confirmed", "payment_provider": "stripe", "payment_id": intent.get("id"), "paid_at": now, "updated_at": now}, "$push": {"status_history": {"status": "confirmed", "at": now}}})
        for cook_id in {item["cook_id"] for item in order["items"]}:
            create_notification(database, cook_id, "new_order", "New paid order received", f"Order {order['order_number']} is paid and waiting for acceptance.", order["_id"])
    elif event_type == "payment_intent.canceled" and order.get("payment_status") == "pending":
        database.orders.update_one({"_id": order["_id"]}, {"$set": {"payment_status": "cancelled", "status": "cancelled", "payment_provider": "stripe", "payment_inventory_restored": True, "updated_at": now}, "$push": {"status_history": {"status": "cancelled", "at": now}}})
        if not order.get("payment_inventory_restored"):
            for item in order["items"]:
                database.foods.update_one({"_id": item["food_id"]}, {"$inc": {"portions": item["quantity"]}})
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
                and intent.metadata.get("order_id") == str(order["_id"])
            )
            if valid_payment:
                now = datetime.now(UTC)
                updated = database.orders.update_one(
                    {"_id": order["_id"], "payment_status": "pending"},
                    {
                        "$set": {"payment_status": "paid", "status": "confirmed", "payment_provider": "stripe", "payment_id": intent.id, "paid_at": now, "updated_at": now},
                        "$push": {"status_history": {"status": "confirmed", "at": now}},
                    },
                )
                if updated.modified_count:
                    for cook_id in {item["cook_id"] for item in order["items"]}:
                        create_notification(database, cook_id, "new_order", "New paid order received", f"Order {order['order_number']} is paid and waiting for acceptance.", order["_id"])
                order["payment_status"] = "paid"
                order["status"] = "confirmed"
        except stripe.StripeError:
            # Webhook processing remains the primary production verification path.
            pass
    return {"success": True, "data": {"order_id": str(order["_id"]), "order_number": order["order_number"], "payment_status": order["payment_status"], "status": order["status"], "total": order["total"]}}


@router.post("/{order_id}/payment/cancel")
def cancel_card_payment(order_id: str, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    order = database.orders.find_one({"_id": object_id(order_id, "order"), "customer_id": user["_id"], "payment_method": "card", "payment_status": "pending"})
    if order is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This payment can no longer be cancelled")
    try:
        stripe.api_key = settings.stripe_secret_key
        stripe.PaymentIntent.cancel(order["stripe_payment_intent_id"])
    except stripe.StripeError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe could not cancel this payment") from error
    now = datetime.now(UTC)
    database.orders.update_one({"_id": order["_id"], "payment_status": "pending"}, {"$set": {"payment_status": "cancelled", "status": "cancelled", "payment_inventory_restored": True, "updated_at": now}, "$push": {"status_history": {"status": "cancelled", "at": now}}})
    if not order.get("payment_inventory_restored"):
        for item in order["items"]:
            database.foods.update_one({"_id": item["food_id"]}, {"$inc": {"portions": item["quantity"]}})
    return {"success": True, "message": "Payment cancelled and reserved portions restored"}


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
    return {"success": True, "data": [serialize(order) for order in orders]}


@router.post("/{order_id}/accept")
def accept_order(
    order_id: str,
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> dict:
    order_object_id = object_id(order_id, "order")
    now = datetime.now(UTC)
    order = database.orders.find_one_and_update(
        {"_id": order_object_id, "items.cook_id": user["_id"], "status": "confirmed"},
        {"$set": {"status": "preparing", "accepted_at": now, "updated_at": now}, "$push": {"status_history": {"status": "preparing", "at": now}}},
        return_document=ReturnDocument.AFTER,
    )
    if order is None:
        owned_order = database.orders.find_one({"_id": order_object_id, "items.cook_id": user["_id"]})
        if owned_order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending orders can be accepted")
    create_notification(
        database, order["customer_id"], "order_accepted", "Order accepted",
        f"Your order {order['order_number']} was accepted.", order["_id"],
    )
    return {"success": True, "message": "Order accepted", "data": serialize(order)}


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: str, payload: OrderStatusUpdate,
    user: dict = Depends(require_roles("home_cook", "admin")), database: Database = Depends(get_database),
) -> dict:
    filters: dict = {"_id": object_id(order_id, "order")}
    if user["role"] == "home_cook":
        filters["items.cook_id"] = user["_id"]
        order = database.orders.find_one(filters)
        if order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        allowed = COOK_STATUS_TRANSITIONS.get(order.get("status"), set())
        if payload.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Order cannot move from {order.get('status')} to {payload.status}",
            )
    now = datetime.now(UTC)
    result = database.orders.update_one(filters, {"$set": {"status": payload.status, "updated_at": now}, "$push": {"status_history": {"status": payload.status, "at": now}}})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    updated_order = database.orders.find_one({"_id": filters["_id"]})
    if payload.status in {"ready_for_pickup", "ready"} and updated_order:
        cook_id = next((item.get("cook_id") for item in updated_order.get("items", []) if item.get("cook_id") == user.get("_id")), None)
        delivery_address = updated_order.get("delivery", {})
        database.deliveries.update_one(
            {"order_id": updated_order["_id"]},
            {"$setOnInsert": {"order_id": updated_order["_id"], "delivery_partner_id": None, "home_cook_id": cook_id,
             "customer_id": updated_order["customer_id"], "pickup_address": user.get("address") or user.get("location") or "Contact Home Cook",
             "delivery_address": delivery_address.get("address", ""), "delivery_fee": updated_order.get("delivery_fee", 0),
             "estimated_distance_km": None, "estimated_arrival_minutes": None,
             "status": "ready_for_pickup", "assigned_at": None, "accepted_at": None, "picked_up_at": None,
             "delivered_at": None, "status_history": [{"status": "ready_for_pickup", "at": now}], "created_at": now, "updated_at": now}},
            upsert=True,
        )
        if payload.status == "ready":
            database.orders.update_one({"_id": updated_order["_id"]}, {"$set": {"status": "ready_for_pickup"}})
            updated_order["status"] = "ready_for_pickup"
    notification_copy = {
        "preparing": ("Order is being prepared", "Your home cook has started preparing your meal."),
        "accepted": ("Order accepted", "Your home cook accepted your order."),
        "ready_for_pickup": ("Order is ready for pickup", "Your meal is waiting for a Delivery Partner."),
        "ready": ("Order is ready", "Your meal is ready for delivery."),
        "out_for_delivery": ("Order is on the way", "Your meal is out for delivery."),
        "delivered": ("Order delivered", "Your order has been marked as delivered. Enjoy your meal!"),
        "cancelled": ("Order cancelled", "Your order has been cancelled."),
    }
    if payload.status in notification_copy and updated_order:
        title, message = notification_copy[payload.status]
        create_notification(
            database, updated_order["customer_id"], f"order_{payload.status}", title,
            f"{message} Order {updated_order['order_number']}", updated_order["_id"],
        )
    return {"success": True, "message": "Order status updated", "data": serialize(updated_order)}


@router.post("/{order_id}/confirm-received")
def confirm_received(order_id: str, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    now = datetime.now(UTC)
    order = database.orders.find_one_and_update(
        {"_id": object_id(order_id, "order"), "customer_id": user["_id"], "status": "delivered"},
        {"$set": {"status": "completed", "completed_at": now, "updated_at": now}, "$push": {"status_history": {"status": "completed", "at": now}}},
        return_document=ReturnDocument.AFTER,
    )
    if not order: raise HTTPException(status_code=409, detail="Only delivered orders can be confirmed")
    database.deliveries.update_one({"order_id": order["_id"], "status": "delivered"}, {"$set": {"status": "completed", "completed_at": now, "updated_at": now}})
    return {"success": True, "message": "Order receipt confirmed", "data": serialize(order)}
