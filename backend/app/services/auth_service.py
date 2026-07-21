from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.config import settings
from app.core.security import create_access_token, create_password_reset_token, hash_password, hash_password_reset_token, verify_password
from app.integrations.email import send_password_reset_email
from app.repositories.user_repository import UserRepository
from app.schemas.auth import ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, LoginResponse, RegisterData, RegisterRequest, RegisterResponse, ResetPasswordRequest, UserResponse


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

    def forgot_password(self, payload: ForgotPasswordRequest) -> ForgotPasswordResponse:
        if not settings.password_reset_debug and (not settings.smtp_host or not settings.smtp_from_email):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Password reset email is not configured",
            )

        user = self.repository.find_by_email(payload.email)
        if user is None:
            return ForgotPasswordResponse()

        token, token_hash = create_password_reset_token()
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.password_reset_expire_minutes)
        self.repository.set_password_reset(user["_id"], token_hash, expires_at)

        if settings.password_reset_debug:
            return ForgotPasswordResponse(reset_token=token)

        try:
            send_password_reset_email(payload.email, token)
        except (OSError, RuntimeError) as error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Password reset email could not be sent",
            ) from error
        return ForgotPasswordResponse()

    def reset_password(self, payload: ResetPasswordRequest) -> dict:
        now = datetime.now(UTC)
        user = self.repository.find_by_valid_reset_token(hash_password_reset_token(payload.token), now)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset token is invalid or expired",
            )
        self.repository.reset_password(user["_id"], hash_password(payload.password), now)
        return {"success": True, "message": "Password reset successfully. You can now log in."}

    @staticmethod
    def _raise_duplicate_error(existing_user: dict, payload: RegisterRequest) -> None:
        field = "email" if existing_user.get("email") == payload.email else "phone_number"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "USER_ALREADY_EXISTS", "field": field, "message": f"This {field.replace('_', ' ')} is already registered"},
        )
