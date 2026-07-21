from bson import ObjectId
from fastapi import HTTPException
import pytest

from app.core.security import create_refresh_token, hash_token
from app.schemas.auth import RefreshTokenRequest
from app.services.auth_service import AuthService


class Users:
    def __init__(self):
        self.user = {"_id": ObjectId(), "role": "customer", "account_status": "active"}

    def find_by_id(self, user_id):
        return self.user if str(self.user["_id"]) == user_id else None


class Tokens:
    def __init__(self):
        self.active = {}
        self.revoked_all = False

    def create(self, user_id, token_id, token_hash, expires_at):
        self.active[token_hash] = {"user_id": user_id, "token_id": token_id, "expires_at": expires_at}

    def consume(self, user_id, token_id, token_hash):
        token = self.active.pop(token_hash, None)
        return token if token and token["user_id"] == user_id and token["token_id"] == token_id else None

    def revoke_all(self, _user_id):
        self.active.clear()
        self.revoked_all = True


def test_refresh_token_rotates_and_cannot_be_reused():
    users, tokens = Users(), Tokens()
    service = AuthService(users, tokens)
    original, token_id, expires_at, _ = create_refresh_token(str(users.user["_id"]), "customer")
    tokens.create(users.user["_id"], token_id, hash_token(original), expires_at)

    refreshed = service.refresh(RefreshTokenRequest(refresh_token=original))
    assert refreshed.access_token
    assert refreshed.refresh_token != original

    with pytest.raises(HTTPException) as reused:
        service.refresh(RefreshTokenRequest(refresh_token=original))
    assert reused.value.status_code == 401
    assert tokens.revoked_all is True
