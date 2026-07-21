from fastapi import APIRouter, Depends, status
from pymongo.database import Database

from app.database.mongodb import get_database
from app.repositories.user_repository import UserRepository
from app.core.dependencies import get_current_user
from app.core.documents import serialize
from app.schemas.auth import ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ResetPasswordRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, database: Database = Depends(get_database)) -> RegisterResponse:
    return AuthService(UserRepository(database)).register(payload)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, database: Database = Depends(get_database)) -> LoginResponse:
    return AuthService(UserRepository(database)).login(payload)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, database: Database = Depends(get_database)) -> ForgotPasswordResponse:
    return AuthService(UserRepository(database)).forgot_password(payload)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, database: Database = Depends(get_database)) -> dict:
    return AuthService(UserRepository(database)).reset_password(payload)


@router.get("/me")
def me(user: dict = Depends(get_current_user)) -> dict:
    return {"success": True, "data": serialize(user)}
