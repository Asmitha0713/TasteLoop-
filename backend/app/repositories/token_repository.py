from datetime import UTC, datetime

from pymongo.database import Database


class TokenRepository:
    def __init__(self, database: Database):
        self.collection = database.refresh_tokens

    def create(self, user_id, token_id: str, token_hash: str, expires_at) -> None:
        self.collection.insert_one({
            "user_id": user_id,
            "token_id": token_id,
            "token_hash": token_hash,
            "expires_at": expires_at,
            "revoked_at": None,
            "created_at": datetime.now(UTC),
        })

    def consume(self, user_id, token_id: str, token_hash: str):
        now = datetime.now(UTC)
        return self.collection.find_one_and_update(
            {
                "user_id": user_id,
                "token_id": token_id,
                "token_hash": token_hash,
                "revoked_at": None,
                "expires_at": {"$gt": now},
            },
            {"$set": {"revoked_at": now}},
        )

    def revoke(self, token_hash: str) -> None:
        self.collection.update_one(
            {"token_hash": token_hash, "revoked_at": None},
            {"$set": {"revoked_at": datetime.now(UTC)}},
        )

    def revoke_all(self, user_id) -> None:
        self.collection.update_many(
            {"user_id": user_id, "revoked_at": None},
            {"$set": {"revoked_at": datetime.now(UTC)}},
        )
