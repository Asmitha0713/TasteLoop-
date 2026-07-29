from datetime import UTC, datetime


def process_mock_refund(order: dict, amount: float, admin_id) -> dict:
    """Development-safe refund ledger entry; replace with the gateway refund API in production."""
    return {
        "processor": "mock",
        "amount": round(amount, 2),
        "currency": "LKR",
        "status": "completed",
        "processed_at": datetime.now(UTC),
        "processed_by": admin_id,
        "original_payment_id": order.get("payment_id"),
    }
