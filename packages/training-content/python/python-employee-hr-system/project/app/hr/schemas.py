from datetime import date
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.hr.models import EmployeeStatus, EmploymentType


class AddressInput(BaseModel):
    street: str = Field(min_length=1)
    city: str = Field(min_length=1)
    country: str = Field(min_length=2)
    postal_code: str = Field(min_length=2)


class EmployeeCreateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    department_id: str
    employment_type: EmploymentType
    hired_on: date
    annual_salary: Decimal = Field(gt=0)
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    address: AddressInput
    skills: set[str] = Field(default_factory=set)


class CompensationChangeRequest(BaseModel):
    annual_salary: Decimal = Field(gt=0)
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    effective_from: date


class LeaveCreateRequest(BaseModel):
    starts_on: date
    ends_on: date
    reason: str = Field(min_length=3, max_length=500)

    @model_validator(mode="after")
    def dates_are_ordered(self) -> "LeaveCreateRequest":
        if self.ends_on < self.starts_on:
            raise ValueError("ends_on must be on or after starts_on")
        return self


class EmployeeResponse(BaseModel):
    id: str
    employee_number: str
    full_name: str
    email: EmailStr
    department_id: str
    employment_type: EmploymentType
    status: EmployeeStatus
    annual_salary: Decimal
    currency: str
    skills: set[str]
