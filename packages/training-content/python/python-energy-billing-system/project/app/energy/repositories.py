from datetime import datetime

from app.energy.models import Invoice, Meter, MeterReading, Tariff


class MeterReadingRepository:
    def __init__(self) -> None:
        self._readings: list[MeterReading] = []

    def save(self, reading: MeterReading) -> MeterReading:
        self._readings.append(reading)
        return reading

    def between(self, meter_id: str, start: datetime, end: datetime) -> list[MeterReading]:
        return sorted(
            (
                item
                for item in self._readings
                if item.meter_id == meter_id and start <= item.recorded_at <= end
            ),
            key=lambda item: item.recorded_at,
        )


class MeterRepository:
    def __init__(self, meters: list[Meter] | None = None) -> None:
        self._meters = {meter.id: meter for meter in meters or []}

    def find_by_id(self, meter_id: str) -> Meter | None:
        return self._meters.get(meter_id)


class TariffRepository:
    def __init__(self, tariffs: list[Tariff] | None = None) -> None:
        self._tariffs = {tariff.id: tariff for tariff in tariffs or []}

    def find_by_id(self, tariff_id: str) -> Tariff | None:
        return self._tariffs.get(tariff_id)


class InvoiceRepository:
    def __init__(self) -> None:
        self._invoices: dict[str, Invoice] = {}

    def save(self, invoice: Invoice) -> Invoice:
        self._invoices[invoice.id] = invoice
        return invoice

    def find_all(self) -> list[Invoice]:
        return list(self._invoices.values())
