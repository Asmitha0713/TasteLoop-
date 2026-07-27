from datetime import UTC, datetime

from bson import ObjectId

from app.api.routes.auth import change_password
from app.api.routes.cook import create_bank_details, delete_bank_details, get_bank_details, update_bank_details
from app.api.routes.foods import _valid_image_signature, update_food_availability
from app.api.routes.orders import accept_order
from app.core.security import hash_password, verify_password
from app.schemas.auth import ChangePasswordRequest
from app.schemas.marketplace import BankDetailsCreate, BankDetailsUpdate, FoodAvailabilityUpdate


class Result:
    matched_count = 1
    deleted_count = 1

    def __init__(self, inserted_id=None):
        self.inserted_id = inserted_id


class FakeUsers:
    def __init__(self):
        self.password_hash = None

    def update_one(self, _filters, update):
        self.password_hash = update["$set"]["password_hash"]
        return Result()


class FakeTokens:
    def __init__(self):
        self.revoked = False

    def update_many(self, _filters, _update):
        self.revoked = True
        return Result()


def test_authenticated_password_change_hashes_password_and_revokes_refresh_tokens():
    database = type("Database", (), {"users": FakeUsers(), "refresh_tokens": FakeTokens()})()
    user = {"_id": ObjectId(), "password_hash": hash_password("OldPass@123")}
    payload = ChangePasswordRequest(current_password="OldPass@123", new_password="NewPass@456", confirm_password="NewPass@456")

    response = change_password(payload, user, database)

    assert response["success"] is True
    assert verify_password("NewPass@456", database.users.password_hash)
    assert database.refresh_tokens.revoked is True


class FakeFoods:
    def __init__(self, cook_id):
        self.food = {"_id": ObjectId(), "cook_id": cook_id, "available": True, "created_at": datetime.now(UTC)}

    def update_one(self, _filters, update):
        self.food.update(update["$set"])
        return Result()

    def find_one(self, _filters):
        return self.food


def test_food_availability_has_a_dedicated_update():
    cook_id = ObjectId()
    database = type("Database", (), {"foods": FakeFoods(cook_id)})()

    response = update_food_availability(str(database.foods.food["_id"]), FoodAvailabilityUpdate(available=False), {"_id": cook_id}, database)

    assert response["data"]["available"] is False
    assert response["message"] == "Food is now inactive"


class FakeOrders:
    def __init__(self, cook_id):
        self.order = {
            "_id": ObjectId(), "order_number": "TL-ACCEPT", "status": "confirmed",
            "customer_id": ObjectId(), "items": [{"cook_id": cook_id}], "created_at": datetime.now(UTC),
        }

    def find_one_and_update(self, filters, update, **_kwargs):
        if self.order["status"] != filters["status"]:
            return None
        self.order.update(update["$set"])
        return self.order

    def find_one(self, _filters):
        return self.order


def test_confirmed_order_can_be_explicitly_accepted():
    cook_id = ObjectId()
    notifications = type("Notifications", (), {"insert_one": lambda self, document: Result(ObjectId())})()
    database = type("Database", (), {"orders": FakeOrders(cook_id), "notifications": notifications})()

    response = accept_order(str(database.orders.order["_id"]), {"_id": cook_id}, database)

    assert response["message"] == "Order accepted"
    assert response["data"]["status"] == "preparing"


class FakeBankDetails:
    def __init__(self):
        self.document = None

    def insert_one(self, document):
        self.document = document
        return Result(ObjectId())

    def find_one(self, _filters):
        return self.document

    def find_one_and_update(self, _filters, update, **_kwargs):
        self.document.update(update["$set"])
        return self.document

    def delete_one(self, _filters):
        self.document = None
        return Result()


def test_bank_details_crud():
    cook = {"_id": ObjectId()}
    database = type("Database", (), {"bank_details": FakeBankDetails()})()
    created = create_bank_details(BankDetailsCreate(
        account_holder_name="Nadeesha Perera", bank_name="Commercial Bank",
        branch_name="Colombo", account_number="1234567890",
    ), cook, database)
    fetched = get_bank_details(cook, database)
    updated = update_bank_details(BankDetailsUpdate(branch_name="Kandy"), cook, database)
    deleted = delete_bank_details(cook, database)

    assert created["success"] is True
    assert fetched["data"]["account_number"] == "1234567890"
    assert updated["data"]["branch_name"] == "Kandy"
    assert deleted is None


def test_image_signature_validation_rejects_spoofed_content():
    assert _valid_image_signature("image/png", b"\x89PNG\r\n\x1a\ncontent") is True
    assert _valid_image_signature("image/png", b"not a png") is False
