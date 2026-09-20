from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.energy.models import BillingStatus


class ReadingIngestRequest(BaseModel):
    meter_id: str
    recorded_at: datetime
    value_kwh: Decimal = Field(ge=0)


class InvoiceCreateRequest(BaseModel):
    meter_id: str
    tariff_id: str
    period_start: date
    period_end: date

    @model_validator(mode="after")
    def dates_are_ordered(self) -> "InvoiceCreateRequest":
        if self.period_end <= self.period_start:
            raise ValueError("period_end must be after period_start")
        return self


class InvoiceResponse(BaseModel):
    id: str
    customer_id: str
    meter_id: str
    period_start: date
    period_end: date
    consumption_kwh: Decimal
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    status: BillingStatus
