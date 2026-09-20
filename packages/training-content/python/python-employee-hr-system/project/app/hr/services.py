from datetime import date
from decimal import Decimal
from uuid import uuid4

from app.exceptions import NotFoundError
from app.hr.compensation import CompensationPolicy
from app.hr.models import Address, Compensation, Employee, EmployeeStatus, LeaveRequest
from app.hr.repositories import DepartmentRepository, EmployeeRepository, LeaveRepository
from app.hr.schemas import EmployeeCreateRequest, LeaveCreateRequest


class EmployeeService:
    def __init__(
        self,
        employees: EmployeeRepository,
        departments: DepartmentRepository,
        leaves: LeaveRepository,
        compensation_policy: CompensationPolicy,
    ) -> None:
        self._employees = employees
        self._departments = departments
        self._leaves = leaves
        self._compensation_policy = compensation_policy

    def create(self, request: EmployeeCreateRequest) -> Employee:
        if not self._departments.exists(request.department_id):
            raise NotFoundError("Department was not found")
        employee_id = str(uuid4())
        employee = Employee(
            id=employee_id,
            employee_number=f"EMP-{employee_id[:8].upper()}",
            first_name=request.first_name,
            last_name=request.last_name,
            email=str(request.email),
            department_id=request.department_id,
            employment_type=request.employment_type,
            status=EmployeeStatus.ACTIVE,
            hired_on=request.hired_on,
            address=Address(**request.address.model_dump()),
            compensation=Compensation(request.annual_salary, request.currency, request.hired_on),
            skills=frozenset(request.skills),
        )
        return self._employees.save(employee)

    def get(self, employee_id: str) -> Employee:
        employee = self._employees.find_by_id(employee_id)
        if employee is None:
            raise NotFoundError("Employee was not found")
        return employee

    def list_all(self) -> list[Employee]:
        return self._employees.find_all()

    def increase_salary(self, employee_id: str, percentage: Decimal) -> Employee:
        employee = self.get(employee_id)
        if not employee.status.can_receive_compensation_changes():
            raise ValueError("Employee status does not allow compensation changes")
        amount = self._compensation_policy.adjusted_salary(employee, percentage)
        updated = employee.with_compensation(
            Compensation(amount, employee.compensation.currency, date.today())
        )
        return self._employees.save(updated)

    def request_leave(self, employee_id: str, request: LeaveCreateRequest) -> LeaveRequest:
        self.get(employee_id)
        leave = LeaveRequest(str(uuid4()), employee_id, request.starts_on, request.ends_on, request.reason)
        return self._leaves.save(leave)
