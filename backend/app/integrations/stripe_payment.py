from decimal import Decimal, ROUND_HALF_UP

import stripe

from app.core.config import settings

CURRENCY = "lkr"


def configured() -> bool:
    return bool(settings.stripe_secret_key and settings.stripe_publishable_key)


def webhook_configured() -> bool:
    return bool(settings.stripe_webhook_secret)


def amount_minor_units(amount: float | int | Decimal) -> int:
    return int((Decimal(str(amount)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def create_payment_intent(order: dict, user: dict):
    if not settings.stripe_secret_key:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured")
    stripe.api_key = settings.stripe_secret_key
    return stripe.PaymentIntent.create(
        amount=amount_minor_units(order["total"]),
        currency=CURRENCY,
        payment_method_types=["card"],
        receipt_email=user["email"],
        description=f"TasteLoop order {order['order_number']}",
        metadata={"order_id": str(order["_id"]), "order_number": order["order_number"]},
    )


def construct_webhook_event(payload: bytes, signature: str):
    if not settings.stripe_webhook_secret:
        raise RuntimeError("STRIPE_WEBHOOK_SECRET is not configured")
    return stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)
