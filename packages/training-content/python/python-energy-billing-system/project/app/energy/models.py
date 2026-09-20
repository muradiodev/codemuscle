from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum


class BillingStatus(StrEnum):
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


@dataclass(frozen=True, slots=True)
class GridArea:
    id: str
    code: str
    timezone: str


@dataclass(frozen=True, slots=True)
class Customer:
    id: str
    account_number: str
    name: str
    email: str


@dataclass(frozen=True, slots=True)
class Meter:
    id: str
    serial_number: str
    customer_id: str
    grid_area_id: str


@dataclass(frozen=True, slots=True)
class MeterReading:
    id: str
    meter_id: str
    recorded_at: datetime
    value_kwh: Decimal


@dataclass(frozen=True, slots=True)
class Tariff:
    id: str
    name: str
    unit_rate: Decimal
    standing_charge: Decimal
    tax_rate: Decimal


@dataclass(frozen=True, slots=True)
class Invoice:
    id: str
    customer_id: str
    meter_id: str
    period_start: date
    period_end: date
    consumption_kwh: Decimal
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    status: BillingStatus = BillingStatus.ISSUED
