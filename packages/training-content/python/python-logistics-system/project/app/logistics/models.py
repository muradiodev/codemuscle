from dataclasses import dataclass, field, replace
from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum


class ShipmentStatus(StrEnum):
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class DeliveryPriority(StrEnum):
    STANDARD = "standard"
    EXPRESS = "express"
    SAME_DAY = "same_day"


@dataclass(frozen=True, slots=True)
class PackageItem:
    sku: str
    description: str
    quantity: int
    unit_weight_kg: Decimal

    @property
    def total_weight_kg(self) -> Decimal:
        return self.unit_weight_kg * self.quantity


@dataclass(frozen=True, slots=True)
class Warehouse:
    id: str
    code: str
    city: str
    country: str


@dataclass(frozen=True, slots=True)
class TrackingEvent:
    status: ShipmentStatus
    location: str
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass(frozen=True, slots=True)
class Shipment:
    id: str
    tracking_number: str
    origin_warehouse_id: str
    destination: str
    priority: DeliveryPriority
    items: tuple[PackageItem, ...]
    shipping_cost: Decimal
    status: ShipmentStatus = ShipmentStatus.CREATED
    events: tuple[TrackingEvent, ...] = ()

    @property
    def total_weight_kg(self) -> Decimal:
        return sum((item.total_weight_kg for item in self.items), start=Decimal("0"))

    def record(self, event: TrackingEvent) -> "Shipment":
        return replace(self, status=event.status, events=(*self.events, event))
