from decimal import Decimal, ROUND_HALF_UP
from typing import Protocol

from app.logistics.models import DeliveryPriority


class ShippingCostStrategy(Protocol):
    def calculate(self, weight_kg: Decimal, distance_km: Decimal, priority: DeliveryPriority) -> Decimal: ...


class WeightDistanceShippingCost:
    _multipliers = {
        DeliveryPriority.STANDARD: Decimal("1.0"),
        DeliveryPriority.EXPRESS: Decimal("1.65"),
        DeliveryPriority.SAME_DAY: Decimal("2.40"),
    }

    def calculate(
        self, weight_kg: Decimal, distance_km: Decimal, priority: DeliveryPriority
    ) -> Decimal:
        base = Decimal("4.50") + weight_kg * Decimal("0.85")
        distance_charge = distance_km * Decimal("0.035")
        total = (base + distance_charge) * self._multipliers[priority]
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
