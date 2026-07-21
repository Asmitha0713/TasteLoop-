from pymongo.database import Database


class UserRepository:
    def __init__(self, database: Database):
        self.collection = database.users

    def find_by_email_or_phone(self, email: str, phone_number: str):
        return self.collection.find_one(
            {"$or": [{"email": email}, {"phone_number": phone_number}]},
            {"email": 1, "phone_number": 1},
        )

    def create(self, user: dict):
        return self.collection.insert_one(user)

    def find_by_identifier(self, identifier: str):
        field = "email" if "@" in identifier else "phone_number"
        return self.collection.find_one({field: identifier})
