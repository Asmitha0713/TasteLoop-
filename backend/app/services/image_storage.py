from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import BACKEND_DIR, settings

MAX_IMAGE_SIZE = 5 * 1024 * 1024
IMAGE_TYPES = {
    "image/jpeg": ((b"\xff\xd8\xff",), ".jpg"),
    "image/png": ((b"\x89PNG\r\n\x1a\n",), ".png"),
    "image/webp": ((b"RIFF",), ".webp"),
}


def _valid_signature(content_type: str, content: bytes) -> bool:
    signatures, _extension = IMAGE_TYPES[content_type]
    if content_type == "image/webp":
        return content.startswith(signatures[0]) and content[8:12] == b"WEBP"
    return any(content.startswith(signature) for signature in signatures)


def _s3_client():
    import boto3

    options = {"region_name": settings.aws_region}
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        options.update({
            "aws_access_key_id": settings.aws_access_key_id,
            "aws_secret_access_key": settings.aws_secret_access_key,
        })
    return boto3.client("s3", **options)


async def store_image(image: UploadFile, folder: str, label: str = "Image") -> str:
    if image.content_type not in IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f"{label} must be a JPEG, PNG, or WebP image")
    content_type = image.content_type
    content = await image.read(MAX_IMAGE_SIZE + 1)
    await image.close()
    if not content:
        raise HTTPException(status_code=400, detail=f"{label} is empty")
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail=f"{label} must not exceed 5 MB")
    if not _valid_signature(content_type, content):
        raise HTTPException(status_code=415, detail=f"{label} content does not match its image type")

    extension = IMAGE_TYPES[content_type][1]
    key = f"{folder.strip('/')}/{uuid4().hex}{extension}"
    if settings.aws_s3_bucket:
        try:
            _s3_client().put_object(
                Bucket=settings.aws_s3_bucket,
                Key=key,
                Body=content,
                ContentType=content_type,
                ServerSideEncryption="AES256",
            )
        except Exception as error:
            raise HTTPException(status_code=502, detail=f"Could not store {label.lower()} in S3") from error
        if settings.aws_s3_public_url:
            return f"{settings.aws_s3_public_url}/{key}"
        return f"s3://{settings.aws_s3_bucket}/{key}"

    destination = BACKEND_DIR / "uploads" / key
    Path(destination).parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    return f"/uploads/{key}"


def storage_url(stored_path: str | None) -> str | None:
    if not stored_path or not stored_path.startswith("s3://"):
        return stored_path
    bucket_and_key = stored_path[5:].split("/", 1)
    if len(bucket_and_key) != 2:
        return stored_path
    try:
        return _s3_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_and_key[0], "Key": bucket_and_key[1]},
            ExpiresIn=3600,
        )
    except Exception:
        return None
