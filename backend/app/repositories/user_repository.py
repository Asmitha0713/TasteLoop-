from pymongo.database import Database
from bson import ObjectId


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

    def find_by_email(self, email: str):
        return self.collection.find_one({"email": email})

    def find_by_id(self, user_id: str):
        if not ObjectId.is_valid(user_id):
            return None
        return self.collection.find_one({"_id": ObjectId(user_id)})

    def set_password_reset(self, user_id, token_hash: str, expires_at):
        return self.collection.update_one(
            {"_id": user_id},
            {"$set": {"password_reset_token_hash": token_hash, "password_reset_expires_at": expires_at}},
        )

    def find_by_valid_reset_token(self, token_hash: str, now):
        return self.collection.find_one({
            "password_reset_token_hash": token_hash,
            "password_reset_expires_at": {"$gt": now},
        })

    def reset_password(self, user_id, password_hash: str, updated_at):
        return self.collection.update_one(
            {"_id": user_id},
            {
                "$set": {"password_hash": password_hash, "updated_at": updated_at},
                "$unset": {"password_reset_token_hash": "", "password_reset_expires_at": ""},
            },
        )
