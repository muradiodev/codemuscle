from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.logistics.models import DeliveryPriority, ShipmentStatus


class PackageItemInput(BaseModel):
    sku: str = Field(min_length=1, max_length=60)
    description: str = Field(min_length=1, max_length=200)
    quantity: int = Field(gt=0)
    unit_weight_kg: Decimal = Field(gt=0)


class ShipmentCreateRequest(BaseModel):
    origin_warehouse_id: str
    destination: str = Field(min_length=3, max_length=300)
    priority: DeliveryPriority = DeliveryPriority.STANDARD
    distance_km: Decimal = Field(gt=0)
    items: list[PackageItemInput] = Field(min_length=1)


class TrackingEventRequest(BaseModel):
    status: ShipmentStatus
    location: str = Field(min_length=2, max_length=200)


class ShipmentResponse(BaseModel):
    id: str
    tracking_number: str
    origin_warehouse_id: str
    destination: str
    priority: DeliveryPriority
    total_weight_kg: Decimal
    shipping_cost: Decimal
    status: ShipmentStatus
    event_count: int
    last_updated_at: datetime | None
