from decimal import Decimal

from app.energy.models import Tariff
from app.energy.strategies import StandardTariffCalculation


def test_tariff_calculation() -> None:
    tariff = Tariff("standard", "Standard", Decimal("0.30"), Decimal("10"), Decimal("0.20"))
    charge = StandardTariffCalculation().calculate(Decimal("100"), tariff)
    assert charge.subtotal == Decimal("40.00")
    assert charge.tax == Decimal("8.00")
    assert charge.total == Decimal("48.00")
