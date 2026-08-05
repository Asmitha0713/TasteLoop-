from decimal import Decimal
from types import SimpleNamespace

from app.integrations import stripe_payment


def test_lkr_amounts_are_converted_to_minor_units_safely():
    assert stripe_payment.amount_minor_units(850) == 85000
    assert stripe_payment.amount_minor_units(Decimal("1050.25")) == 105025
    assert stripe_payment.amount_minor_units(10.005) == 1001


def test_payment_intent_uses_trusted_order_total(monkeypatch):
    captured = {}
    monkeypatch.setattr(stripe_payment, "settings", SimpleNamespace(
        stripe_secret_key="sk_test_example", stripe_webhook_secret="whsec_example",
        client_url="http://localhost:5173",
    ))
    monkeypatch.setattr(stripe_payment.stripe.PaymentIntent, "create", lambda **kwargs: captured.update(kwargs) or SimpleNamespace(id="pi_test_1", client_secret="pi_test_secret"))
    order = {
        "_id": "order-id", "order_number": "TL-TEST", "delivery_fee": 300, "total": 1300,
        "items": [{"name": "Rice and Curry", "unit_price": 500, "quantity": 2}],
    }
    intent = stripe_payment.create_payment_intent(order, {"email": "customer@example.com"})
    assert intent.id == "pi_test_1"
    assert captured["amount"] == 130000
    assert captured["currency"] == "lkr"
    assert captured["metadata"]["order_id"] == "order-id"
