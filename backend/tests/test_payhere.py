from types import SimpleNamespace

from app.integrations import payhere


def test_checkout_hash_and_notification_verification(monkeypatch):
    fake_settings = SimpleNamespace(
        payhere_merchant_id="1211149",
        payhere_merchant_secret="secret",
        payhere_sandbox=True,
        client_url="http://localhost:5173",
        backend_public_url="https://api.example.com",
    )
    monkeypatch.setattr(payhere, "settings", fake_settings)
    order_id = "TL-ABC123"
    amount = 1500.0
    currency = "LKR"
    status_code = "2"
    amount_text = payhere.amount_string(amount)
    secret_hash = payhere._digest(fake_settings.payhere_merchant_secret)
    signature = payhere._digest(f"{fake_settings.payhere_merchant_id}{order_id}{amount_text}{currency}{status_code}{secret_hash}")
    notification = {
        "merchant_id": fake_settings.payhere_merchant_id,
        "order_id": order_id,
        "payhere_amount": amount_text,
        "payhere_currency": currency,
        "status_code": status_code,
        "md5sig": signature,
    }
    assert payhere.verify_notification(notification)
    assert not payhere.verify_notification({**notification, "payhere_amount": "1.00"})
    assert payhere.checkout_hash(order_id, amount)
