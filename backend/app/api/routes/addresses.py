from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import DESCENDING
from pymongo.database import Database

from app.core.dependencies import require_roles
from app.core.documents import object_id, serialize
from app.database.mongodb import get_database
from app.schemas.marketplace import DeliveryAddressCreate, DeliveryAddressUpdate

router = APIRouter(prefix="/api/addresses", tags=["Delivery Addresses"])


def _set_only_default(database: Database, customer_id, address_id) -> None:
    database.addresses.update_many(
        {"customer_id": customer_id, "_id": {"$ne": address_id}, "is_default": True},
        {"$set": {"is_default": False, "updated_at": datetime.now(UTC)}},
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_address(
    payload: DeliveryAddressCreate,
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> dict:
    now = datetime.now(UTC)
    has_address = database.addresses.count_documents({"customer_id": user["_id"]}, limit=1) > 0
    document = payload.model_dump()
    document.update({
        "customer_id": user["_id"],
        "is_default": payload.is_default or not has_address,
        "created_at": now,
        "updated_at": now,
    })
    if document["is_default"]:
        _set_only_default(database, user["_id"], None)
    result = database.addresses.insert_one(document)
    document["_id"] = result.inserted_id
    return {"success": True, "message": "Delivery address created", "data": serialize(document)}


@router.get("")
def list_addresses(
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> dict:
    addresses = database.addresses.find({"customer_id": user["_id"]}).sort([
        ("is_default", DESCENDING), ("updated_at", DESCENDING),
    ])
    return {"success": True, "data": [serialize(address) for address in addresses]}


@router.get("/{address_id}")
def get_address(
    address_id: str,
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> dict:
    address = database.addresses.find_one({
        "_id": object_id(address_id, "delivery address"),
        "customer_id": user["_id"],
    })
    if address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery address not found")
    return {"success": True, "data": serialize(address)}


@router.patch("/{address_id}")
def update_address(
    address_id: str,
    payload: DeliveryAddressUpdate,
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> dict:
    address_object_id = object_id(address_id, "delivery address")
    current = database.addresses.find_one({"_id": address_object_id, "customer_id": user["_id"]})
    if current is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery address not found")
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("is_default") is False and current.get("is_default"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Set another address as default before removing the current default")
    if changes.get("is_default") is True:
        _set_only_default(database, user["_id"], address_object_id)
    changes["updated_at"] = datetime.now(UTC)
    database.addresses.update_one({"_id": address_object_id, "customer_id": user["_id"]}, {"$set": changes})
    updated = database.addresses.find_one({"_id": address_object_id})
    return {"success": True, "message": "Delivery address updated", "data": serialize(updated)}


@router.delete("/{address_id}")
def delete_address(
    address_id: str,
    user: dict = Depends(require_roles("customer")),
    database: Database = Depends(get_database),
) -> dict:
    address_object_id = object_id(address_id, "delivery address")
    address = database.addresses.find_one({"_id": address_object_id, "customer_id": user["_id"]})
    if address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery address not found")
    database.addresses.delete_one({"_id": address_object_id, "customer_id": user["_id"]})
    if address.get("is_default"):
        replacement = database.addresses.find_one(
            {"customer_id": user["_id"]},
            sort=[("updated_at", DESCENDING)],
        )
        if replacement:
            database.addresses.update_one(
                {"_id": replacement["_id"]},
                {"$set": {"is_default": True, "updated_at": datetime.now(UTC)}},
            )
    return {"success": True, "message": "Delivery address deleted"}
