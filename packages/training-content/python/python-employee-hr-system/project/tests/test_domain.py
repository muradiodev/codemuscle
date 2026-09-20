from datetime import date
from decimal import Decimal

from app.hr.compensation import PercentageIncreasePolicy
from app.hr.models import Address, Compensation, Employee, EmployeeStatus, EmploymentType


def test_percentage_increase_policy() -> None:
    employee = Employee(
        "1", "EMP-1", "Ada", "Lovelace", "ada@example.com", "engineering",
        EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2025, 1, 1),
        Address("1 Main St", "Berlin", "DE", "10115"),
        Compensation(Decimal("100000"), "EUR", date(2025, 1, 1)),
    )
    assert PercentageIncreasePolicy().adjusted_salary(employee, Decimal("5")) == Decimal("105000.00")
