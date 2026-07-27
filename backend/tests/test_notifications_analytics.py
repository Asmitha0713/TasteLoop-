from datetime import UTC, datetime

from bson import ObjectId

from app.api.routes.admin import reports_revenue_analytics
from app.api.routes.notifications import list_notifications, mark_all_notifications_read, mark_notification_read


class Result:
    matched_count = 1
    modified_count = 2


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *_args):
        return self

    def limit(self, value):
        self.rows = self.rows[:value]
        return self

    def __iter__(self):
        return iter(self.rows)


class Notifications:
    def __init__(self, user_id):
        self.rows = [{
            "_id": ObjectId(), "user_id": user_id, "type": "order_preparing",
            "title": "Order is being prepared", "message": "Your meal is being prepared.",
            "read": False, "created_at": datetime.now(UTC),
        }]

    def find(self, filters):
        return Cursor([row for row in self.rows if row["user_id"] == filters["user_id"]])

    def count_documents(self, _filters):
        return sum(not row["read"] for row in self.rows)

    def update_one(self, filters, update):
        row = next(item for item in self.rows if item["_id"] == filters["_id"])
        row.update(update["$set"])
        return Result()

    def update_many(self, _filters, update):
        for row in self.rows:
            row.update(update["$set"])
        return Result()


def test_notification_list_and_read_workflow():
    user = {"_id": ObjectId()}
    collection = Notifications(user["_id"])
    database = type("Database", (), {"notifications": collection})()

    listed = list_notifications(False, 30, user, database)
    marked = mark_notification_read(listed["data"][0]["id"], user, database)
    all_marked = mark_all_notifications_read(user, database)

    assert listed["unread_count"] == 1
    assert marked["success"] is True
    assert all_marked["updated"] == 2


class Orders:
    def __init__(self):
        self.calls = 0

    def aggregate(self, _pipeline):
        self.calls += 1
        if self.calls == 1:
            return iter([{
                "summary": [{"gross_revenue": 5000, "order_count": 4, "average_order_value": 1250}],
                "series": [{"_id": "2026-07-27", "revenue": 5000, "orders": 4}],
            }])
        return iter([{"_id": "delivered", "count": 4}, {"_id": "preparing", "count": 2}])


class Reports:
    def aggregate(self, _pipeline):
        return iter([{
            "by_status": [{"_id": "open", "count": 3}, {"_id": "resolved", "count": 2}],
            "by_type": [{"_id": "Food quality", "count": 4}],
            "high_priority": [{"count": 1}], "total": [{"count": 5}],
        }])


def test_reports_and_revenue_analytics_response():
    database = type("Database", (), {"orders": Orders(), "reports": Reports()})()

    response = reports_revenue_analytics("month", {"role": "admin"}, database)

    assert response["data"]["revenue"]["gross"] == 5000
    assert response["data"]["revenue"]["delivered_orders"] == 4
    assert response["data"]["orders_by_status"]["preparing"] == 2
    assert response["data"]["reports"]["total"] == 5
    assert response["data"]["reports"]["high_priority_open"] == 1
