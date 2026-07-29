import asyncio
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import HTTPException

from app.api.routes import complaints as complaint_routes
from app.schemas.marketplace import ComplaintRefundRequest


class InsertResult:
    def __init__(self, inserted_id): self.inserted_id = inserted_id


class Collection:
    def __init__(self, rows=None): self.rows = list(rows or [])
    def find_one(self, query, *_args):
        for row in self.rows:
            matches = True
            for key, value in query.items():
                if isinstance(value, dict) and "$ne" in value:
                    matches = matches and row.get(key) != value["$ne"]
                else: matches = matches and row.get(key) == value
            if matches: return row
        return None
    def find(self, query, *_args):
        return [row for row in self.rows if all(row.get(key) == value for key, value in query.items())]
    def insert_one(self, row):
        row_id = row.get("_id", ObjectId()); row["_id"] = row_id; self.rows.append(row); return InsertResult(row_id)
    def update_one(self, query, update):
        row = self.find_one(query)
        if row:
            row.update(update.get("$set", {}))
            for key, value in update.get("$push", {}).items(): row.setdefault(key, []).append(value)
        return SimpleNamespace(matched_count=1 if row else 0)


class Database:
    def __init__(self, order, customer, complaint=None):
        self.orders = Collection([order]); self.users = Collection([customer])
        self.complaints = Collection([complaint] if complaint else [])
        self.notifications = Collection(); self.foods = Collection()


def test_customer_can_create_complaint_for_own_delivered_order(monkeypatch):
    customer_id, cook_id, order_id = ObjectId(), ObjectId(), ObjectId()
    customer = {"_id": customer_id, "role": "customer", "full_name": "Customer"}
    order = {"_id": order_id, "customer_id": customer_id, "order_number": "TL-1", "status": "delivered", "items": [{"cook_id": cook_id}]}
    database = Database(order, customer)
    async def fake_store(_image): return "/uploads/complaints/evidence.jpg"
    monkeypatch.setattr(complaint_routes, "store_evidence", fake_store)
    response = asyncio.run(complaint_routes.create_complaint(
        str(order_id), "food_spilled", "The entire meal spilled in transit.", "refund", object(), customer, database,
    ))
    assert response["data"]["complaint_status"] == "pending"
    assert response["data"]["customer_id"] == str(customer_id)


def test_customer_cannot_report_undelivered_order(monkeypatch):
    customer_id, order_id = ObjectId(), ObjectId()
    customer = {"_id": customer_id, "role": "customer"}
    order = {"_id": order_id, "customer_id": customer_id, "order_number": "TL-2", "status": "preparing", "items": []}
    database = Database(order, customer)
    async def fake_store(_image): return "/unused.jpg"
    monkeypatch.setattr(complaint_routes, "store_evidence", fake_store)
    with pytest.raises(HTTPException) as error:
        asyncio.run(complaint_routes.create_complaint(str(order_id), "other", "This order is not delivered yet.", "refund", object(), customer, database))
    assert error.value.status_code == 409


def test_full_refund_is_calculated_from_original_order():
    customer_id, admin_id, cook_id, order_id, complaint_id = ObjectId(), ObjectId(), ObjectId(), ObjectId(), ObjectId()
    customer = {"_id": customer_id, "full_name": "Customer"}
    order = {"_id": order_id, "customer_id": customer_id, "order_number": "TL-3", "status": "delivered", "total": 2500.0, "items": [], "payment_id": "PAY-1"}
    complaint = {"_id": complaint_id, "order_id": order_id, "customer_id": customer_id, "cook_id": cook_id, "complaint_status": "approved", "created_at": datetime.now(UTC)}
    database = Database(order, customer, complaint)
    response = complaint_routes.refund_complaint(str(complaint_id), ComplaintRefundRequest(refund_type="full"), {"_id": admin_id}, database)
    assert response["data"]["refund_amount"] == 2500.0
    assert order["refund_amount"] == 2500.0
    assert order["refund_processor"] == "mock"
