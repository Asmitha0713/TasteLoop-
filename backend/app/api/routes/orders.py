from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import DESCENDING
from pymongo.database import Database

from app.core.dependencies import require_roles
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database
from app.schemas.marketplace import CheckoutRequest, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["Orders"])
DELIVERY_FEE = 300


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
            "emoji": food.get("emoji", "🍽️"), "color": food.get("color", "#f4dfb8"),
        })
    now = datetime.now(UTC)
    order = {
        "order_number": f"TL-{uuid4().hex[:8].upper()}", "customer_id": user["_id"],
        "items": order_items, "subtotal": subtotal, "delivery_fee": DELIVERY_FEE,
        "total": subtotal + DELIVERY_FEE, "delivery": payload.model_dump(exclude={"payment_method"}),
        "payment_method": payload.payment_method, "payment_status": "pending" if payload.payment_method == "card" else "cash_on_delivery",
        "status": "confirmed", "status_history": [{"status": "confirmed", "at": now}],
        "created_at": now, "updated_at": now,
    }
    result = database.orders.insert_one(order)
    for item in order_items:
        database.foods.update_one({"_id": item["food_id"]}, {"$inc": {"portions": -item["quantity"]}})
    database.carts.delete_one({"customer_id": user["_id"]})
    order["_id"] = result.inserted_id
    return {"success": True, "message": "Order placed successfully", "data": serialize(order)}


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


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: str, payload: OrderStatusUpdate,
    user: dict = Depends(require_roles("home_cook", "admin")), database: Database = Depends(get_database),
) -> dict:
    filters: dict = {"_id": object_id(order_id, "order")}
    if user["role"] == "home_cook":
        filters["items.cook_id"] = user["_id"]
    now = datetime.now(UTC)
    result = database.orders.update_one(filters, {"$set": {"status": payload.status, "updated_at": now}, "$push": {"status_history": {"status": payload.status, "at": now}}})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return {"success": True, "message": "Order status updated", "data": serialize(database.orders.find_one({"_id": filters["_id"]}))}
