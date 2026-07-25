from datetime import UTC, datetime

from bson import ObjectId

from app.api.routes.cook import dashboard_stats


class FakeCursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *_args):
        return self

    def limit(self, value):
        self.rows = self.rows[:value]
        return self

    def __iter__(self):
        return iter(self.rows)


class FakeFoods:
    def __init__(self):
        self.counts = iter([6, 3, 2, 1])

    def count_documents(self, _filters):
        return next(self.counts)

    def aggregate(self, _pipeline):
        return iter([{"weighted_rating": 42.5, "review_count": 10}])


class FakeOrders:
    def __init__(self, cook_id):
        self.cook_id = cook_id

    def aggregate(self, _pipeline):
        return iter([{
            "total_orders": 8,
            "pending_orders": 2,
            "completed_orders": 5,
            "cancelled_orders": 1,
            "total_earnings": 12500.5,
            "month_earnings": 4200,
            "portions_sold": 14,
        }])

    def find(self, _filters):
        return FakeCursor([{
            "_id": ObjectId(),
            "order_number": "TL-TEST123",
            "status": "delivered",
            "created_at": datetime(2026, 7, 22, tzinfo=UTC),
            "items": [
                {"cook_id": self.cook_id, "quantity": 2, "total": 1700},
                {"cook_id": ObjectId(), "quantity": 1, "total": 500},
            ],
        }])


class FakeDatabase:
    def __init__(self, cook_id):
        self.foods = FakeFoods()
        self.orders = FakeOrders(cook_id)


def test_home_cook_dashboard_stats_response():
    cook_id = ObjectId()

    response = dashboard_stats({"_id": cook_id, "role": "home_cook"}, FakeDatabase(cook_id))

    assert response["success"] is True
    assert response["data"]["foods"] == {
        "total": 6, "available": 3, "pending_approval": 2, "sold_out": 1,
    }
    assert response["data"]["orders"] == {
        "total": 8, "pending": 2, "completed": 5, "cancelled": 1,
    }
    assert response["data"]["earnings"] == {"total": 12500.5, "this_month": 4200}
    assert response["data"]["portions_sold"] == 14
    assert response["data"]["rating"] == {"average": 4.25, "review_count": 10}
    assert response["data"]["recent_orders"][0]["amount"] == 1700
    assert response["data"]["recent_orders"][0]["item_count"] == 2
    assert response["data"]["recent_orders"][0]["id"]
