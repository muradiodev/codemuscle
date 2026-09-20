from dataclasses import dataclass, field, replace
from datetime import date
from decimal import Decimal
from enum import StrEnum


class EmployeeStatus(StrEnum):
    CANDIDATE = "candidate"
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"

    def can_receive_compensation_changes(self) -> bool:
        return self in {EmployeeStatus.ACTIVE, EmployeeStatus.ON_LEAVE}


class EmploymentType(StrEnum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"


@dataclass(frozen=True, slots=True)
class Department:
    id: str
    code: str
    name: str


@dataclass(frozen=True, slots=True)
class Address:
    street: str
    city: str
    country: str
    postal_code: str


@dataclass(frozen=True, slots=True)
class Compensation:
    annual_salary: Decimal
    currency: str
    effective_from: date


@dataclass(frozen=True, slots=True)
class Employee:
    id: str
    employee_number: str
    first_name: str
    last_name: str
    email: str
    department_id: str
    employment_type: EmploymentType
    status: EmployeeStatus
    hired_on: date
    address: Address
    compensation: Compensation
    skills: frozenset[str] = field(default_factory=frozenset)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def with_compensation(self, compensation: Compensation) -> "Employee":
        return replace(self, compensation=compensation)


@dataclass(frozen=True, slots=True)
class LeaveRequest:
    id: str
    employee_id: str
    starts_on: date
    ends_on: date
    reason: str
