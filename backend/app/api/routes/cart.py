from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.core.dependencies import require_roles
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database
from app.schemas.marketplace import CartItemRequest, CartQuantityUpdate

router = APIRouter(prefix="/api/cart", tags=["Cart"])


def _expanded_cart(database: Database, customer_id) -> dict:
    cart = database.carts.find_one({"customer_id": customer_id}) or {"customer_id": customer_id, "items": []}
    foods = {food["_id"]: food for food in database.foods.find({"_id": {"$in": [item["food_id"] for item in cart["items"]]}})}
    items, subtotal = [], 0.0
    for row in cart["items"]:
        food = foods.get(row["food_id"])
        if not food:
            continue
        item = serialize(food)
        item["quantity"] = row["quantity"]
        item["line_total"] = round(food["price"] * row["quantity"], 2)
        subtotal += item["line_total"]
        items.append(item)
    return {"items": items, "subtotal": round(subtotal, 2), "delivery_fee": 300 if items else 0, "total": round(subtotal + (300 if items else 0), 2)}


@router.get("")
def get_cart(user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    return {"success": True, "data": _expanded_cart(database, user["_id"])}


@router.post("/items", status_code=status.HTTP_201_CREATED)
def add_item(payload: CartItemRequest, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    food_id = object_id(payload.food_id, "food")
    food = database.foods.find_one({"_id": food_id, "moderation_status": "approved", "available": True})
    if not food:
        raise HTTPException(status_code=404, detail="Food is not available")
    cart = database.carts.find_one({"customer_id": user["_id"]})
    current = next((x["quantity"] for x in (cart or {}).get("items", []) if x["food_id"] == food_id), 0)
    if current + payload.quantity > food.get("portions", 0):
        raise HTTPException(status_code=409, detail="Requested quantity is not available")
    now = datetime.now(UTC)
    result = database.carts.update_one({"customer_id": user["_id"], "items.food_id": food_id}, {"$inc": {"items.$.quantity": payload.quantity}, "$set": {"updated_at": now}})
    if result.matched_count == 0:
        database.carts.update_one({"customer_id": user["_id"]}, {"$setOnInsert": {"created_at": now}, "$set": {"updated_at": now}, "$push": {"items": {"food_id": food_id, "quantity": payload.quantity}}}, upsert=True)
    return {"success": True, "message": "Item added to cart", "data": _expanded_cart(database, user["_id"])}


@router.patch("/items/{food_id}")
def update_item(food_id: str, payload: CartQuantityUpdate, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    fid = object_id(food_id, "food")
    food = database.foods.find_one({"_id": fid})
    if not food or payload.quantity > food.get("portions", 0):
        raise HTTPException(status_code=409, detail="Requested quantity is not available")
    result = database.carts.update_one({"customer_id": user["_id"], "items.food_id": fid}, {"$set": {"items.$.quantity": payload.quantity, "updated_at": datetime.now(UTC)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"success": True, "data": _expanded_cart(database, user["_id"])}


@router.delete("/items/{food_id}")
def remove_item(food_id: str, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    database.carts.update_one({"customer_id": user["_id"]}, {"$pull": {"items": {"food_id": object_id(food_id, "food")}}, "$set": {"updated_at": datetime.now(UTC)}})
    return {"success": True, "message": "Item removed", "data": _expanded_cart(database, user["_id"])}


@router.delete("")
def clear_cart(user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    database.carts.update_one({"customer_id": user["_id"]}, {"$set": {"items": [], "updated_at": datetime.now(UTC)}})
    return {"success": True, "message": "Cart cleared"}
