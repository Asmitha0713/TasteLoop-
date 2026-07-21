from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import HTTPException

import app.services.auth_service as auth_module
from app.core.security import verify_password
from app.schemas.auth import ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth_service import AuthService


class FakeRepository:
    def __init__(self):
        self.user = {
            "_id": ObjectId(),
            "email": "customer@example.com",
            "password_hash": "old hash",
        }

    def find_by_email(self, email):
        return self.user if email == self.user["email"] else None

    def set_password_reset(self, user_id, token_hash, expires_at):
        assert user_id == self.user["_id"]
        self.user["password_reset_token_hash"] = token_hash
        self.user["password_reset_expires_at"] = expires_at

    def find_by_valid_reset_token(self, token_hash, now):
        if self.user.get("password_reset_token_hash") == token_hash and self.user["password_reset_expires_at"] > now:
            return self.user
        return None

    def reset_password(self, user_id, password_hash, updated_at):
        assert user_id == self.user["_id"]
        assert updated_at <= datetime.now(UTC)
        self.user["password_hash"] = password_hash
        self.user.pop("password_reset_token_hash", None)
        self.user.pop("password_reset_expires_at", None)


class FakeTokenRepository:
    def revoke_all(self, _user_id):
        pass


@pytest.fixture(autouse=True)
def debug_password_reset(monkeypatch):
    monkeypatch.setattr(auth_module, "settings", SimpleNamespace(
        password_reset_debug=True,
        password_reset_expire_minutes=30,
        smtp_host="",
        smtp_from_email="",
    ))


def test_forgot_and_reset_password():
    repository = FakeRepository()
    service = AuthService(repository, FakeTokenRepository())
    response = service.forgot_password(ForgotPasswordRequest(email="Customer@Example.com"))

    assert response.reset_token
    assert response.reset_token not in repository.user["password_reset_token_hash"]

    result = service.reset_password(ResetPasswordRequest(
        token=response.reset_token,
        password="NewStrong@123",
        confirm_password="NewStrong@123",
    ))
    assert result["success"] is True
    assert verify_password("NewStrong@123", repository.user["password_hash"])

    with pytest.raises(HTTPException) as reused:
        service.reset_password(ResetPasswordRequest(
            token=response.reset_token,
            password="AnotherStrong@123",
            confirm_password="AnotherStrong@123",
        ))
    assert reused.value.status_code == 400


def test_unknown_email_uses_generic_response():
    response = AuthService(FakeRepository(), FakeTokenRepository()).forgot_password(ForgotPasswordRequest(email="missing@example.com"))
    assert response.success is True
    assert response.reset_token is None
