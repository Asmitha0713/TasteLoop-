from hashlib import md5
from hmac import compare_digest

from app.core.config import settings


def configured() -> bool:
    return bool(settings.payhere_merchant_id and settings.payhere_merchant_secret)


def _digest(value: str) -> str:
    return md5(value.encode("utf-8"), usedforsecurity=False).hexdigest().upper()


def amount_string(amount: float) -> str:
    return f"{amount:.2f}"


def checkout_hash(order_id: str, amount: float, currency: str = "LKR") -> str:
    secret_hash = _digest(settings.payhere_merchant_secret)
    return _digest(f"{settings.payhere_merchant_id}{order_id}{amount_string(amount)}{currency}{secret_hash}")


def verify_notification(data: dict[str, str]) -> bool:
    if data.get("merchant_id") != settings.payhere_merchant_id:
        return False
    required = ("merchant_id", "order_id", "payhere_amount", "payhere_currency", "status_code", "md5sig")
    if any(not data.get(key) for key in required):
        return False
    secret_hash = _digest(settings.payhere_merchant_secret)
    expected = _digest(
        f"{data['merchant_id']}{data['order_id']}{data['payhere_amount']}"
        f"{data['payhere_currency']}{data['status_code']}{secret_hash}"
    )
    return compare_digest(expected, data["md5sig"].upper())


def checkout_payload(order: dict, user: dict) -> dict[str, str]:
    delivery = order["delivery"]
    names = delivery["full_name"].split(maxsplit=1)
    first_name = names[0]
    last_name = names[1] if len(names) > 1 else "-"
    order_id = order["order_number"]
    amount = amount_string(order["total"])
    frontend_result = f"{settings.client_url}/payment-result?order_id={order['_id']}"
    gateway_url = "https://sandbox.payhere.lk/pay/checkout" if settings.payhere_sandbox else "https://www.payhere.lk/pay/checkout"
    fields = {
        "merchant_id": settings.payhere_merchant_id,
        "return_url": frontend_result,
        "cancel_url": f"{frontend_result}&cancelled=1",
        "notify_url": f"{settings.backend_public_url}/api/orders/payhere/notify",
        "first_name": first_name,
        "last_name": last_name,
        "email": user["email"],
        "phone": delivery["phone_number"],
        "address": delivery["address"],
        "city": delivery["city"],
        "country": "Sri Lanka",
        "order_id": order_id,
        "items": ", ".join(item["name"] for item in order["items"])[:255],
        "currency": "LKR",
        "amount": amount,
        "hash": checkout_hash(order_id, order["total"]),
    }
    return {"url": gateway_url, "fields": fields}
