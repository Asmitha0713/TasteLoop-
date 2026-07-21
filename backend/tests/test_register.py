from bson import ObjectId
from fastapi import HTTPException
from pydantic import ValidationError
import pytest

from app.api.routes.auth import login, register
from app.schemas.auth import LoginRequest, RegisterRequest


class InsertResult:
    inserted_id = ObjectId("669e1234567890abcdef1234")


class FakeUsers:
    def __init__(self):
        self.users = []

    def find_one(self, query, projection=None):
        del projection
        if "$or" in query:
            conditions = query["$or"]
            return next(
                (user for user in self.users if any(user.get(field) == value for condition in conditions for field, value in condition.items())),
                None,
            )
        return next((user for user in self.users if all(user.get(field) == value for field, value in query.items())), None)

    def insert_one(self, user):
        stored = {**user, "_id": InsertResult.inserted_id}
        self.users.append(stored)
        return InsertResult()


class FakeDatabase:
    def __init__(self):
        self.users = FakeUsers()
        self.refresh_tokens = FakeRefreshTokens()


class FakeRefreshTokens:
    def __init__(self):
        self.tokens = []

    def insert_one(self, token):
        self.tokens.append(token)
        return InsertResult()


def valid_payload(**changes):
    payload = {
        "full_name": "Nimal Perera",
        "email": "Nimal@Example.com",
        "phone_number": "+94771234567",
        "password": "StrongPass@123",
        "confirm_password": "StrongPass@123",
        "role": "customer",
    }
    payload.update(changes)
    return payload


def test_register_user_hashes_password_and_normalizes_email():
    database = FakeDatabase()
    response = register(RegisterRequest(**valid_payload()), database)

    assert response.success is True
    assert response.data.user.email == "nimal@example.com"
    assert response.data.user.account_status == "active"
    assert database.users.users[0]["password_hash"] != "StrongPass@123"
    assert "confirm_password" not in database.users.users[0]


def test_duplicate_email_returns_conflict():
    database = FakeDatabase()
    register(RegisterRequest(**valid_payload()), database)

    with pytest.raises(HTTPException) as error:
        register(RegisterRequest(**valid_payload(phone_number="+94770000000")), database)

    assert error.value.status_code == 409
    assert error.value.detail["code"] == "USER_ALREADY_EXISTS"


def test_weak_password_is_rejected():
    with pytest.raises(ValidationError):
        RegisterRequest(**valid_payload(password="weak", confirm_password="weak"))


def test_password_whitespace_is_preserved():
    password = " StrongPass@123 "
    payload = RegisterRequest(**valid_payload(password=password, confirm_password=password))
    assert payload.password == password


def test_home_cook_starts_pending():
    database = FakeDatabase()
    response = register(RegisterRequest(**valid_payload(role="home_cook")), database)
    assert response.data.user.account_status == "pending_approval"


def test_registered_customer_can_login():
    database = FakeDatabase()
    register(RegisterRequest(**valid_payload()), database)
    response = login(LoginRequest(identifier="NIMAL@example.com", password="StrongPass@123"), database)
    assert response.success is True
    assert response.data.user.email == "nimal@example.com"
    assert response.data.access_token
