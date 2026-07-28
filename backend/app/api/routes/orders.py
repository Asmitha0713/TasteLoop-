from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pymongo import DESCENDING, ReturnDocument
from pymongo.database import Database

from app.core.dependencies import require_roles
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database
from app.integrations.payhere import amount_string, checkout_payload, configured as payhere_configured, verify_notification
from app.schemas.marketplace import CheckoutRequest, OrderStatusUpdate
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/orders", tags=["Orders"])
DELIVERY_FEE = 300
COOK_STATUS_TRANSITIONS = {
    "confirmed": {"preparing", "cancelled"},
    "preparing": {"ready", "cancelled"},
    "ready": {"out_for_delivery"},
    "out_for_delivery": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


@router.post("", status_code=status.HTTP_201_CREATED)
def checkout(payload: CheckoutRequest, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    if payload.payment_method == "card" and not payhere_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Card payments are not configured yet")
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
    now = datetime.now(UTC)
    order = {
        "order_number": f"TL-{uuid4().hex[:8].upper()}", "customer_id": user["_id"],
        "items": order_items, "subtotal": subtotal, "delivery_fee": DELIVERY_FEE,
        "total": subtotal + DELIVERY_FEE, "delivery": payload.model_dump(exclude={"payment_method"}),
        "payment_method": payload.payment_method, "payment_status": "pending" if payload.payment_method == "card" else "cash_on_delivery",
        "status": "payment_pending" if payload.payment_method == "card" else "confirmed",
        "status_history": [{"status": "payment_pending" if payload.payment_method == "card" else "confirmed", "at": now}],
        "created_at": now, "updated_at": now,
    }
    result = database.orders.insert_one(order)
    for item in order_items:
        database.foods.update_one({"_id": item["food_id"]}, {"$inc": {"portions": -item["quantity"]}})
    database.carts.delete_one({"customer_id": user["_id"]})
    order["_id"] = result.inserted_id
    if payload.payment_method == "cash":
        for cook_id in {item["cook_id"] for item in order_items}:
            create_notification(
                database, cook_id, "new_order", "New order received",
                f"Order {order['order_number']} is waiting for your acceptance.", order["_id"],
            )
    response = {"success": True, "message": "Order placed successfully", "data": serialize(order)}
    if payload.payment_method == "card":
        response["message"] = "Continue to PayHere to complete payment"
        response["payment"] = checkout_payload(order, user)
    return response


@router.post("/payhere/notify", include_in_schema=False)
async def payhere_notification(request: Request, database: Database = Depends(get_database)) -> Response:
    if not payhere_configured():
        return Response(status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    form = await request.form()
    data = {key: str(value) for key, value in form.items()}
    if not verify_notification(data):
        return Response(status_code=status.HTTP_400_BAD_REQUEST)
    order = database.orders.find_one({"order_number": data["order_id"], "payment_method": "card"})
    if order is None or data.get("payhere_currency") != "LKR" or data.get("payhere_amount") != amount_string(order["total"]):
        return Response(status_code=status.HTTP_400_BAD_REQUEST)

    status_code = data["status_code"]
    payment_statuses = {"2": "paid", "0": "pending", "-1": "cancelled", "-2": "failed", "-3": "chargedback"}
    payment_status = payment_statuses.get(status_code, "failed")
    now = datetime.now(UTC)
    previous_status = order.get("payment_status")
    changes = {
        "payment_status": payment_status,
        "payment_id": data.get("payment_id"),
        "payment_method_detail": data.get("method"),
        "payment_status_message": data.get("status_message"),
        "updated_at": now,
    }
    if payment_status == "paid":
        changes["status"] = "confirmed"
    elif payment_status in {"cancelled", "failed", "chargedback"}:
        changes["status"] = "cancelled"
    database.orders.update_one({"_id": order["_id"]}, {"$set": changes, "$push": {"status_history": {"status": changes.get("status", "payment_pending"), "at": now}}})

    if payment_status == "paid" and previous_status != "paid":
        for cook_id in {item["cook_id"] for item in order["items"]}:
            create_notification(database, cook_id, "new_order", "New paid order received", f"Order {order['order_number']} is paid and waiting for acceptance.", order["_id"])
    elif payment_status in {"cancelled", "failed", "chargedback"} and not order.get("payment_inventory_restored"):
        for item in order["items"]:
            database.foods.update_one({"_id": item["food_id"]}, {"$inc": {"portions": item["quantity"]}})
        database.orders.update_one({"_id": order["_id"]}, {"$set": {"payment_inventory_restored": True}})
    return Response(status_code=status.HTTP_200_OK)


@router.get("/{order_id}/payment")
def payment_status(order_id: str, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    order = database.orders.find_one({"_id": object_id(order_id, "order"), "customer_id": user["_id"]})
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return {"success": True, "data": {"order_id": str(order["_id"]), "order_number": order["order_number"], "payment_status": order["payment_status"], "status": order["status"], "total": order["total"]}}


@router.get("")
def my_orders(
    order_status: str | None = Query(default=None, alias="status"),
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> dict:
    filters: dict = {"customer_id": user["_id"]}
    if order_status:
        filters["status"] = order_status
    return {"success": True, "data": [serialize(order) for order in database.orders.find(filters).sort("created_at", DESCENDING)]}


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
        {"$set": {"status": "preparing", "updated_at": now}, "$push": {"status_history": {"status": "preparing", "at": now}}},
        return_document=ReturnDocument.AFTER,
    )
    if order is None:
        owned_order = database.orders.find_one({"_id": order_object_id, "items.cook_id": user["_id"]})
        if owned_order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only confirmed orders can be accepted")
    create_notification(
        database, order["customer_id"], "order_accepted", "Order accepted",
        f"Your order {order['order_number']} was accepted and is being prepared.", order["_id"],
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
    notification_copy = {
        "preparing": ("Order is being prepared", "Your home cook has started preparing your meal."),
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
