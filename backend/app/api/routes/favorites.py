from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import DESCENDING
from pymongo.database import Database

from app.core.dependencies import require_roles
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


@router.get("")
def list_favorites(
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> dict:
    favorites = list(database.favorites.find({"customer_id": user["_id"]}).sort("created_at", DESCENDING))
    food_ids = [favorite["food_id"] for favorite in favorites]
    foods_by_id = {
        food["_id"]: food for food in database.foods.find({
            "_id": {"$in": food_ids}, "moderation_status": "approved",
        })
    }
    foods = [serialize(foods_by_id[food_id]) for food_id in food_ids if food_id in foods_by_id]
    return {"success": True, "data": foods, "favorite_ids": [str(food["id"]) for food in foods]}


@router.post("/{food_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    food_id: str,
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> dict:
    food_object_id = object_id(food_id, "food")
    food = database.foods.find_one({"_id": food_object_id, "moderation_status": "approved"})
    if food is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
    database.favorites.update_one(
        {"customer_id": user["_id"], "food_id": food_object_id},
        {"$setOnInsert": {"created_at": datetime.now(UTC)}},
        upsert=True,
    )
    return {"success": True, "message": "Added to favorites", "data": serialize(food)}


@router.delete("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    food_id: str,
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> None:
    result = database.favorites.delete_one({"customer_id": user["_id"], "food_id": object_id(food_id, "food")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
