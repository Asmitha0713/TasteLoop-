from fastapi import APIRouter, Depends, status
from pymongo.database import Database

from app.database.mongodb import get_database
from app.repositories.user_repository import UserRepository
from app.repositories.token_repository import TokenRepository
from app.core.dependencies import get_current_user
from app.core.documents import serialize
from app.schemas.auth import ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, LoginResponse, RefreshTokenRequest, RegisterRequest, RegisterResponse, ResetPasswordRequest, TokenPairResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def auth_service(database: Database) -> AuthService:
    return AuthService(UserRepository(database), TokenRepository(database))


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, database: Database = Depends(get_database)) -> RegisterResponse:
    return auth_service(database).register(payload)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, database: Database = Depends(get_database)) -> LoginResponse:
    return auth_service(database).login(payload)


@router.post("/refresh", response_model=TokenPairResponse)
def refresh(payload: RefreshTokenRequest, database: Database = Depends(get_database)) -> TokenPairResponse:
    return auth_service(database).refresh(payload)


@router.post("/logout")
def logout(payload: RefreshTokenRequest, database: Database = Depends(get_database)) -> dict:
    return auth_service(database).logout(payload)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, database: Database = Depends(get_database)) -> ForgotPasswordResponse:
    return auth_service(database).forgot_password(payload)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, database: Database = Depends(get_database)) -> dict:
    return auth_service(database).reset_password(payload)


@router.get("/me")
def me(user: dict = Depends(get_current_user)) -> dict:
    return {"success": True, "data": serialize(user)}
