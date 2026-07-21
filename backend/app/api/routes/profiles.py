from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.core.dependencies import get_current_user
from app.core.documents import serialize
from app.database.mongodb import get_database
from app.schemas.marketplace import ProfileUpdate

router = APIRouter(prefix="/api/profile", tags=["Profiles"])


@router.get("")
def get_profile(user: dict = Depends(get_current_user)) -> dict:
    return {"success": True, "data": serialize(user)}


@router.patch("")
def update_profile(
    payload: ProfileUpdate,
    user: dict = Depends(get_current_user),
    database: Database = Depends(get_database),
) -> dict:
    changes = payload.model_dump(exclude_none=True)
    cook_fields = {"kitchen_name", "location", "specialty", "bio"}
    if user["role"] != "home_cook" and cook_fields.intersection(changes):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cook profile fields require a Home Cook account")
    if not changes:
        return {"success": True, "message": "No changes supplied", "data": serialize(user)}
    changes["updated_at"] = datetime.now(UTC)
    try:
        database.users.update_one({"_id": user["_id"]}, {"$set": changes})
    except DuplicateKeyError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or phone number is already registered") from error
    updated = database.users.find_one({"_id": user["_id"]})
    return {"success": True, "message": "Profile updated successfully", "data": serialize(updated)}
