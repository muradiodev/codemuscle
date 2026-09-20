from decimal import Decimal

from app.logistics.models import DeliveryPriority
from app.logistics.strategies import WeightDistanceShippingCost


def test_shipping_cost_strategy() -> None:
    cost = WeightDistanceShippingCost().calculate(
        Decimal("10"), Decimal("100"), DeliveryPriority.EXPRESS
    )
    assert cost == Decimal("27.23")
