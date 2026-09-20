from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Protocol

from app.energy.models import Tariff


@dataclass(frozen=True, slots=True)
class ChargeBreakdown:
    subtotal: Decimal
    tax: Decimal
    total: Decimal


class TariffCalculationStrategy(Protocol):
    def calculate(self, consumption_kwh: Decimal, tariff: Tariff) -> ChargeBreakdown: ...


class StandardTariffCalculation:
    def calculate(self, consumption_kwh: Decimal, tariff: Tariff) -> ChargeBreakdown:
        money = Decimal("0.01")
        subtotal = (consumption_kwh * tariff.unit_rate + tariff.standing_charge).quantize(
            money, rounding=ROUND_HALF_UP
        )
        tax = (subtotal * tariff.tax_rate).quantize(money, rounding=ROUND_HALF_UP)
        return ChargeBreakdown(subtotal=subtotal, tax=tax, total=subtotal + tax)
