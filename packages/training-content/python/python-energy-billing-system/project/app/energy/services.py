from datetime import UTC, datetime, time
from decimal import Decimal
from uuid import uuid4

from app.energy.models import Invoice, MeterReading
from app.energy.repositories import InvoiceRepository, MeterReadingRepository, MeterRepository, TariffRepository
from app.energy.schemas import InvoiceCreateRequest, ReadingIngestRequest
from app.energy.strategies import TariffCalculationStrategy
from app.exceptions import NotFoundError


class BillingService:
    def __init__(
        self,
        readings: MeterReadingRepository,
        meters: MeterRepository,
        tariffs: TariffRepository,
        invoices: InvoiceRepository,
        calculation: TariffCalculationStrategy,
    ) -> None:
        self._readings = readings
        self._meters = meters
        self._tariffs = tariffs
        self._invoices = invoices
        self._calculation = calculation

    def ingest(self, request: ReadingIngestRequest) -> MeterReading:
        if self._meters.find_by_id(request.meter_id) is None:
            raise NotFoundError("Meter was not found")
        reading = MeterReading(str(uuid4()), request.meter_id, request.recorded_at, request.value_kwh)
        return self._readings.save(reading)

    def create_invoice(self, request: InvoiceCreateRequest) -> Invoice:
        meter = self._meters.find_by_id(request.meter_id)
        tariff = self._tariffs.find_by_id(request.tariff_id)
        if meter is None:
            raise NotFoundError("Meter was not found")
        if tariff is None:
            raise NotFoundError("Tariff was not found")
        start = datetime.combine(request.period_start, time.min, tzinfo=UTC)
        end = datetime.combine(request.period_end, time.max, tzinfo=UTC)
        values = self._readings.between(meter.id, start, end)
        consumption = values[-1].value_kwh - values[0].value_kwh if len(values) >= 2 else Decimal("0")
        if consumption < 0:
            raise ValueError("Meter readings cannot move backwards")
        charges = self._calculation.calculate(consumption, tariff)
        invoice = Invoice(
            str(uuid4()), meter.customer_id, meter.id, request.period_start, request.period_end,
            consumption, charges.subtotal, charges.tax, charges.total,
        )
        return self._invoices.save(invoice)

    def list_invoices(self) -> list[Invoice]:
        return self._invoices.find_all()
