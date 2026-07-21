import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_password_reset_email(recipient: str, reset_token: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        raise RuntimeError("SMTP is not configured")

    reset_url = f"{settings.client_url.rstrip('/')}/reset-password?token={reset_token}"
    message = EmailMessage()
    message["Subject"] = "Reset your TasteLoop password"
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(
        "A password reset was requested for your TasteLoop account.\n\n"
        f"Reset your password: {reset_url}\n\n"
        f"This link expires in {settings.password_reset_expire_minutes} minutes. "
        "If you did not request it, you can ignore this email."
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)
