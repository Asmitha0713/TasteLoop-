from datetime import UTC, datetime

from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, LoginResponse, RegisterData, RegisterRequest, RegisterResponse, UserResponse


class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def register(self, payload: RegisterRequest) -> RegisterResponse:
        existing_user = self.repository.find_by_email_or_phone(payload.email, payload.phone_number)
        if existing_user:
            self._raise_duplicate_error(existing_user, payload)

        now = datetime.now(UTC)
        account_status = "pending_approval" if payload.role.value == "home_cook" else "active"
        user_document = {
            "full_name": payload.full_name,
            "email": payload.email,
            "phone_number": payload.phone_number,
            "password_hash": hash_password(payload.password),
            "role": payload.role.value,
            "account_status": account_status,
            "created_at": now,
            "updated_at": now,
        }

        try:
            result = self.repository.create(user_document)
        except DuplicateKeyError as error:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "USER_ALREADY_EXISTS", "message": "Email or phone number is already registered"},
            ) from error

        user_id = str(result.inserted_id)
        access_token, expires_in = create_access_token(user_id, payload.role.value)
        user = UserResponse(
            id=user_id,
            full_name=payload.full_name,
            email=payload.email,
            phone_number=payload.phone_number,
            role=payload.role,
            account_status=account_status,
            created_at=now.isoformat(),
        )
        return RegisterResponse(
            message="Account registered successfully",
            data=RegisterData(user=user, access_token=access_token, expires_in=expires_in),
        )

    def login(self, payload: LoginRequest) -> LoginResponse:
        user_document = self.repository.find_by_identifier(payload.identifier)
        if user_document is None or not verify_password(payload.password, user_document.get("password_hash", "")):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email, phone number, or password")
        if user_document.get("account_status") != "active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not active")
        user_id = str(user_document["_id"])
        access_token, expires_in = create_access_token(user_id, user_document["role"])
        user = UserResponse(
            id=user_id,
            full_name=user_document["full_name"],
            email=user_document["email"],
            phone_number=user_document["phone_number"],
            role=user_document["role"],
            account_status=user_document["account_status"],
            created_at=user_document["created_at"].isoformat(),
        )
        return LoginResponse(data=RegisterData(user=user, access_token=access_token, expires_in=expires_in))

    @staticmethod
    def _raise_duplicate_error(existing_user: dict, payload: RegisterRequest) -> None:
        field = "email" if existing_user.get("email") == payload.email else "phone_number"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "USER_ALREADY_EXISTS", "field": field, "message": f"This {field.replace('_', ' ')} is already registered"},
        )
