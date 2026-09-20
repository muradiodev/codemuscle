from decimal import Decimal, ROUND_HALF_UP
from typing import Protocol

from app.hr.models import Employee


class CompensationPolicy(Protocol):
    def adjusted_salary(self, employee: Employee, percentage: Decimal) -> Decimal: ...


class PercentageIncreasePolicy:
    def adjusted_salary(self, employee: Employee, percentage: Decimal) -> Decimal:
        if percentage <= 0 or percentage > Decimal("25"):
            raise ValueError("percentage must be between 0 and 25")
        multiplier = Decimal("1") + percentage / Decimal("100")
        return (employee.compensation.annual_salary * multiplier).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
