from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    phone_number: str | None = Field(default=None, min_length=9, max_length=20)
    address: str | None = Field(default=None, max_length=250)
    city: str | None = Field(default=None, max_length=100)
    delivery_note: str | None = Field(default=None, max_length=300)
    preferences: dict[str, bool] | None = None
    kitchen_name: str | None = Field(default=None, min_length=2, max_length=100)
    location: str | None = Field(default=None, max_length=100)
    specialty: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=1000)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None):
        return str(value).lower() if value else value


class FoodCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=50)
    price: float = Field(gt=0, le=1_000_000)
    portions: int = Field(ge=0, le=100_000)
    description: str = Field(default="", max_length=1000)
    ingredients: list[str] = Field(default_factory=list, max_length=100)
    prep_time: int | None = Field(default=None, ge=0, le=1440)
    available: bool = True
    image_url: str | None = Field(default=None, max_length=500)
    emoji: str = Field(default="🍽️", max_length=10)
    color: str = Field(default="#f4dfb8", pattern=r"^#[0-9A-Fa-f]{6}$")


class FoodUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=2, max_length=120)
    category: str | None = Field(default=None, min_length=2, max_length=50)
    price: float | None = Field(default=None, gt=0, le=1_000_000)
    portions: int | None = Field(default=None, ge=0, le=100_000)
    description: str | None = Field(default=None, max_length=1000)
    ingredients: list[str] | None = Field(default=None, max_length=100)
    prep_time: int | None = Field(default=None, ge=0, le=1440)
    available: bool | None = None
    image_url: str | None = Field(default=None, max_length=500)


class CartItemRequest(BaseModel):
    food_id: str
    quantity: int = Field(default=1, ge=1, le=100)


class CartQuantityUpdate(BaseModel):
    quantity: int = Field(ge=1, le=100)


class CheckoutRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=100)
    phone_number: str = Field(min_length=9, max_length=20)
    address: str = Field(min_length=5, max_length=250)
    city: str = Field(min_length=2, max_length=100)
    landmark: str | None = Field(default=None, max_length=200)
    delivery_time: datetime | None = None
    payment_method: Literal["cash", "card"] = "cash"


class OrderStatusUpdate(BaseModel):
    status: Literal["confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]


class AdminUserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone_number: str = Field(min_length=9, max_length=20)
    password: str = Field(min_length=8, max_length=72)
    role: Literal["customer", "home_cook", "admin"]
    account_status: Literal["active", "pending_approval", "suspended"] = "active"


class AccountStatusUpdate(BaseModel):
    account_status: Literal["active", "pending_approval", "suspended"]


class FoodModerationUpdate(BaseModel):
    moderation_status: Literal["pending", "approved", "rejected", "flagged"]


class ReportCreate(BaseModel):
    report_type: str = Field(min_length=2, max_length=80)
    subject: str = Field(min_length=2, max_length=150)
    against_user_id: str | None = None
    related_order_id: str | None = None
    related_food_id: str | None = None
    details: str = Field(min_length=10, max_length=2000)


class ReportUpdate(BaseModel):
    status: Literal["open", "investigating", "resolved"]
    priority: Literal["low", "medium", "high"] | None = None


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


class DeliveryAddressCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    label: str = Field(default="Home", min_length=1, max_length=40)
    recipient_name: str = Field(min_length=2, max_length=100)
    phone_number: str = Field(min_length=9, max_length=20)
    address_line: str = Field(min_length=5, max_length=250)
    city: str = Field(min_length=2, max_length=100)
    landmark: str | None = Field(default=None, max_length=200)
    delivery_note: str | None = Field(default=None, max_length=300)
    is_default: bool = False

    @field_validator("phone_number")
    @classmethod
    def normalize_phone_number(cls, value: str) -> str:
        normalized = "".join(character for character in value if character not in " -()")
        digits = normalized[1:] if normalized.startswith("+") else normalized
        if not digits.isdigit() or not 9 <= len(digits) <= 15:
            raise ValueError("Enter a valid phone number with 9 to 15 digits")
        return normalized


class DeliveryAddressUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    label: str | None = Field(default=None, min_length=1, max_length=40)
    recipient_name: str | None = Field(default=None, min_length=2, max_length=100)
    phone_number: str | None = Field(default=None, min_length=9, max_length=20)
    address_line: str | None = Field(default=None, min_length=5, max_length=250)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    landmark: str | None = Field(default=None, max_length=200)
    delivery_note: str | None = Field(default=None, max_length=300)
    is_default: bool | None = None

    @field_validator("phone_number")
    @classmethod
    def normalize_phone_number(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return DeliveryAddressCreate.normalize_phone_number(value)
