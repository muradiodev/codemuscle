from collections import defaultdict
from datetime import date
from decimal import Decimal

from app.energy.models import MeterReading


def daily_consumption(readings: list[MeterReading]) -> dict[date, Decimal]:
    grouped: dict[date, list[MeterReading]] = defaultdict(list)
    for reading in readings:
        grouped[reading.recorded_at.date()].append(reading)
    return {
        day: max(items, key=lambda item: item.recorded_at).value_kwh
        - min(items, key=lambda item: item.recorded_at).value_kwh
        for day, items in grouped.items()
        if len(items) >= 2
    }
