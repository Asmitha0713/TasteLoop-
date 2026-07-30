from typing import Literal

from pydantic import BaseModel, Field, field_validator


class DeliveryProfileUpdate(BaseModel):
    phone: str | None = Field(default=None, min_length=9, max_length=20)
    address: str | None = Field(default=None, min_length=5, max_length=300)
    vehicle_type: str | None = Field(default=None, min_length=2, max_length=60)
    vehicle_number: str | None = Field(default=None, min_length=2, max_length=40)


class AvailabilityUpdate(BaseModel):
    availability: Literal["online", "offline"]


class DeliveryStatusUpdate(BaseModel):
    status: Literal["arrived_at_pickup", "picked_up", "out_for_delivery", "delivered"]


class PartnerApprovalUpdate(BaseModel):
    approval_status: Literal["approved", "rejected"]
    admin_notes: str | None = Field(default=None, max_length=500)


class PartnerAccountStatusUpdate(BaseModel):
    status: Literal["active", "suspended"]


class DeliveryAssignment(BaseModel):
    delivery_partner_id: str


class DeliveryRegistrationData(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str
    password: str = Field(min_length=8, max_length=72)
    phone: str = Field(min_length=9, max_length=20)
    address: str = Field(min_length=5, max_length=300)
    has_vehicle: Literal["yes", "no"]
    vehicle_type: str | None = Field(default=None, min_length=2, max_length=60)
    vehicle_number: str | None = Field(default=None, min_length=2, max_length=40)
    licence_number: str = Field(min_length=3, max_length=80)
    nic_number: str = Field(min_length=5, max_length=40)
    bank_name: str = Field(min_length=2, max_length=100)
    bank_account_name: str = Field(min_length=2, max_length=100)
    bank_account_number: str = Field(min_length=4, max_length=50)
    bank_branch: str = Field(min_length=2, max_length=100)

    @field_validator("email")
    @classmethod
    def email_format(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.rsplit("@", 1)[-1]:
            raise ValueError("Enter a valid email address")
        return value
