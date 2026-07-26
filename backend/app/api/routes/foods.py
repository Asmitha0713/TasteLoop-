from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pymongo import ASCENDING, DESCENDING
from pymongo.database import Database

from app.core.dependencies import require_roles
from app.core.config import BACKEND_DIR
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database
from app.schemas.marketplace import FoodAvailabilityUpdate, FoodCreate, FoodUpdate, ReviewCreate

router = APIRouter(prefix="/api/foods", tags=["Foods"])
UPLOAD_DIR = BACKEND_DIR / "uploads" / "foods"
MAX_IMAGE_SIZE = 5 * 1024 * 1024
IMAGE_SIGNATURES = {
    "image/jpeg": ((b"\xff\xd8\xff",), ".jpg"),
    "image/png": ((b"\x89PNG\r\n\x1a\n",), ".png"),
    "image/webp": ((b"RIFF",), ".webp"),
}


def _valid_image_signature(content_type: str, content: bytes) -> bool:
    signatures, _extension = IMAGE_SIGNATURES[content_type]
    if content_type == "image/webp":
        return content.startswith(signatures[0]) and content[8:12] == b"WEBP"
    return any(content.startswith(signature) for signature in signatures)


@router.get("")
def list_foods(
    query: str | None = None,
    category: str | None = None,
    max_price: float | None = Query(default=None, gt=0),
    sort: str = "recommended",
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=24, ge=1, le=100),
    database: Database = Depends(get_database),
) -> dict:
    filters: dict = {"moderation_status": "approved", "available": True, "portions": {"$gt": 0}}
    if query:
        filters["$or"] = [{"name": {"$regex": query, "$options": "i"}}, {"description": {"$regex": query, "$options": "i"}}]
    if category and category.lower() != "all":
        filters["category"] = category
    if max_price is not None:
        filters["price"] = {"$lte": max_price}
    ordering = [("rating", DESCENDING)]
    if sort == "price_low":
        ordering = [("price", ASCENDING)]
    elif sort == "price_high":
        ordering = [("price", DESCENDING)]
    cursor = database.foods.find(filters).sort(ordering).skip(skip).limit(limit)
    items = [serialize(food) for food in cursor]
    return {"success": True, "data": items, "pagination": {"skip": skip, "limit": limit, "total": database.foods.count_documents(filters)}}


@router.get("/categories")
def categories(database: Database = Depends(get_database)) -> dict:
    values = database.foods.distinct("category", {"moderation_status": "approved"})
    return {"success": True, "data": sorted(values)}


@router.post("/images", status_code=status.HTTP_201_CREATED)
async def upload_food_image(
    image: UploadFile = File(...),
    _user: dict = Depends(require_roles("home_cook")),
) -> dict:
    if image.content_type not in IMAGE_SIGNATURES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only JPEG, PNG, and WebP images are allowed")
    content = await image.read(MAX_IMAGE_SIZE + 1)
    await image.close()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image file is empty")
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image must not exceed 5 MB")
    if not _valid_image_signature(image.content_type, content):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="File content does not match its image type")
    extension = IMAGE_SIGNATURES[image.content_type][1]
    filename = f"{uuid4().hex}{extension}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / filename).write_bytes(content)
    return {"success": True, "message": "Food image uploaded", "data": {"image_url": f"/uploads/foods/{filename}"}}


@router.get("/{food_id}")
def food_detail(food_id: str, database: Database = Depends(get_database)) -> dict:
    food = database.foods.find_one({"_id": object_id(food_id, "food"), "moderation_status": "approved"})
    if food is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
    cook = database.users.find_one({"_id": food["cook_id"]}, {"password_hash": 0})
    data = serialize(food)
    data["cook"] = serialize(cook)
    data["reviews"] = [serialize(review) for review in database.reviews.find({"food_id": food["_id"]}).sort("created_at", DESCENDING).limit(50)]
    return {"success": True, "data": data}


@router.post("/{food_id}/reviews", status_code=status.HTTP_201_CREATED)
def review_food(food_id: str, payload: ReviewCreate, user: dict = Depends(require_roles("customer")), database: Database = Depends(get_database)) -> dict:
    fid = object_id(food_id, "food")
    food = database.foods.find_one({"_id": fid, "moderation_status": "approved"})
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    delivered = database.orders.find_one({"customer_id": user["_id"], "items.food_id": fid, "status": "delivered"})
    if not delivered:
        raise HTTPException(status_code=403, detail="Only customers who received this food can review it")
    now = datetime.now(UTC)
    review = {"food_id": fid, "customer_id": user["_id"], "customer_name": user["full_name"], "rating": payload.rating, "comment": payload.comment, "created_at": now, "updated_at": now}
    existing = database.reviews.find_one({"food_id": fid, "customer_id": user["_id"]})
    if existing:
        database.reviews.update_one({"_id": existing["_id"]}, {"$set": {"rating": payload.rating, "comment": payload.comment, "updated_at": now}})
        review["_id"] = existing["_id"]
    else:
        review["_id"] = database.reviews.insert_one(review).inserted_id
    ratings = list(database.reviews.find({"food_id": fid}, {"rating": 1}))
    database.foods.update_one({"_id": fid}, {"$set": {"rating": round(sum(x["rating"] for x in ratings) / len(ratings), 2), "review_count": len(ratings)}})
    return {"success": True, "message": "Review saved", "data": serialize(review)}


@router.get("/mine/list")
def my_foods(user: dict = Depends(require_roles("home_cook")), database: Database = Depends(get_database)) -> dict:
    return {"success": True, "data": [serialize(food) for food in database.foods.find({"cook_id": user["_id"]}).sort("created_at", DESCENDING)]}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_food(payload: FoodCreate, user: dict = Depends(require_roles("home_cook")), database: Database = Depends(get_database)) -> dict:
    now = datetime.now(UTC)
    food = payload.model_dump()
    food.update({
        "cook_id": user["_id"], "cook_name": user.get("kitchen_name") or user["full_name"],
        "moderation_status": "pending", "rating": 0.0, "review_count": 0,
        "created_at": now, "updated_at": now,
    })
    result = database.foods.insert_one(food)
    food["_id"] = result.inserted_id
    return {"success": True, "message": "Food submitted for approval", "data": serialize(food)}


@router.patch("/{food_id}")
def update_food(food_id: str, payload: FoodUpdate, user: dict = Depends(require_roles("home_cook")), database: Database = Depends(get_database)) -> dict:
    food_object_id = object_id(food_id, "food")
    changes = payload.model_dump(exclude_none=True)
    changes.update({"updated_at": datetime.now(UTC), "moderation_status": "pending"})
    result = database.foods.update_one({"_id": food_object_id, "cook_id": user["_id"]}, {"$set": changes})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
    return {"success": True, "message": "Food updated and submitted for approval", "data": serialize(database.foods.find_one({"_id": food_object_id}))}


@router.patch("/{food_id}/availability")
def update_food_availability(
    food_id: str,
    payload: FoodAvailabilityUpdate,
    user: dict = Depends(require_roles("home_cook")),
    database: Database = Depends(get_database),
) -> dict:
    food_object_id = object_id(food_id, "food")
    result = database.foods.update_one(
        {"_id": food_object_id, "cook_id": user["_id"]},
        {"$set": {"available": payload.available, "updated_at": datetime.now(UTC)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
    return {
        "success": True,
        "message": "Food is now active" if payload.available else "Food is now inactive",
        "data": serialize(database.foods.find_one({"_id": food_object_id})),
    }


@router.delete("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food(food_id: str, user: dict = Depends(require_roles("home_cook")), database: Database = Depends(get_database)) -> None:
    result = database.foods.delete_one({"_id": object_id(food_id, "food"), "cook_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
