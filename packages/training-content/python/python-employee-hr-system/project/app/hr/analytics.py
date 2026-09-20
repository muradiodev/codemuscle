from collections import Counter
from decimal import Decimal

from app.hr.models import Employee, EmployeeStatus


def headcount_by_status(employees: list[Employee]) -> dict[EmployeeStatus, int]:
    counts = Counter(employee.status for employee in employees)
    return {status: counts.get(status, 0) for status in EmployeeStatus}


def total_annual_payroll(employees: list[Employee], currency: str) -> Decimal:
    return sum(
        (
            employee.compensation.annual_salary
            for employee in employees
            if employee.status != EmployeeStatus.TERMINATED
            and employee.compensation.currency == currency
        ),
        start=Decimal("0"),
    )
