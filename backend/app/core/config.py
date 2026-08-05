import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_db: str = os.getenv("MONGODB_DB", "tasteloop")
    client_url: str = os.getenv("CLIENT_URL", "http://localhost:5173")
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    password_reset_expire_minutes: int = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "30"))
    password_reset_debug: bool = os.getenv("PASSWORD_RESET_DEBUG", "false").lower() == "true"
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from_email: str = os.getenv("SMTP_FROM_EMAIL", "")
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    backend_public_url: str = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:5000").rstrip("/")
    stripe_secret_key: str = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_publishable_key: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    stripe_webhook_secret: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region: str = os.getenv("AWS_REGION", "ap-south-1")
    aws_s3_bucket: str = os.getenv("AWS_S3_BUCKET", "")
    aws_s3_public_url: str = os.getenv("AWS_S3_PUBLIC_URL", "").rstrip("/")


settings = Settings()
