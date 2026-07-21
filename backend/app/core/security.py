from datetime import UTC, datetime, timedelta
import hashlib
import secrets
from uuid import uuid4

import bcrypt
import jwt
from jwt import InvalidTokenError

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str, role: str) -> tuple[str, int]:
    expires_in = settings.access_token_expire_minutes * 60
    expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)
    payload = {"sub": user_id, "role": role, "type": "access", "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm), expires_in


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except InvalidTokenError as error:
        raise ValueError("Invalid or expired access token") from error
    if payload.get("type") != "access" or not payload.get("sub"):
        raise ValueError("Invalid access token")
    return payload


def create_refresh_token(user_id: str, role: str) -> tuple[str, str, datetime, int]:
    expires_in = settings.refresh_token_expire_days * 24 * 60 * 60
    expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)
    token_id = uuid4().hex
    payload = {"sub": user_id, "role": role, "jti": token_id, "type": "refresh", "exp": expires_at}
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, token_id, expires_at, expires_in


def decode_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except InvalidTokenError as error:
        raise ValueError("Invalid or expired refresh token") from error
    if payload.get("type") != "refresh" or not payload.get("sub") or not payload.get("jti"):
        raise ValueError("Invalid refresh token")
    return payload


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_password_reset_token() -> tuple[str, str]:
    token = secrets.token_urlsafe(48)
    return token, hash_password_reset_token(token)


def hash_password_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
