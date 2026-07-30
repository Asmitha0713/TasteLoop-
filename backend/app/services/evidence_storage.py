from fastapi import UploadFile

from app.services.image_storage import storage_url, store_image


async def store_evidence(image: UploadFile) -> str:
    return await store_image(image, "complaints", "Evidence image")


def evidence_url(stored_path: str | None) -> str | None:
    return storage_url(stored_path)
