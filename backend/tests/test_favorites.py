from datetime import UTC, datetime

from bson import ObjectId

from app.api.routes.favorites import add_favorite, list_favorites, remove_favorite


class Result:
    deleted_count = 1


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *_args):
        return self

    def __iter__(self):
        return iter(self.rows)


class FavoritesCollection:
    def __init__(self):
        self.rows = []

    def update_one(self, filters, update, upsert=False):
        assert upsert is True
        if not any(row["customer_id"] == filters["customer_id"] and row["food_id"] == filters["food_id"] for row in self.rows):
            self.rows.append({**filters, **update["$setOnInsert"]})
        return Result()

    def find(self, filters):
        return Cursor([row for row in self.rows if row["customer_id"] == filters["customer_id"]])

    def delete_one(self, filters):
        self.rows = [row for row in self.rows if not (row["customer_id"] == filters["customer_id"] and row["food_id"] == filters["food_id"])]
        return Result()


class FoodsCollection:
    def __init__(self, food):
        self.food = food

    def find_one(self, filters):
        return self.food if self.food["_id"] == filters["_id"] else None

    def find(self, _filters):
        return [self.food]


def test_customer_can_add_list_and_remove_favorite():
    customer = {"_id": ObjectId(), "role": "customer"}
    food = {"_id": ObjectId(), "name": "Rice and Curry", "moderation_status": "approved", "created_at": datetime.now(UTC)}
    database = type("Database", (), {"favorites": FavoritesCollection(), "foods": FoodsCollection(food)})()

    added = add_favorite(str(food["_id"]), customer, database)
    listed = list_favorites(customer, database)
    removed = remove_favorite(str(food["_id"]), customer, database)

    assert added["message"] == "Added to favorites"
    assert listed["favorite_ids"] == [str(food["_id"])]
    assert listed["data"][0]["name"] == "Rice and Curry"
    assert removed is None
