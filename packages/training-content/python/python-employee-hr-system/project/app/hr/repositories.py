from typing import Protocol

from app.hr.models import Department, Employee, LeaveRequest


class EmployeeRepository(Protocol):
    def save(self, employee: Employee) -> Employee: ...
    def find_by_id(self, employee_id: str) -> Employee | None: ...
    def find_all(self) -> list[Employee]: ...


class InMemoryEmployeeRepository:
    def __init__(self) -> None:
        self._employees: dict[str, Employee] = {}

    def save(self, employee: Employee) -> Employee:
        self._employees[employee.id] = employee
        return employee

    def find_by_id(self, employee_id: str) -> Employee | None:
        return self._employees.get(employee_id)

    def find_all(self) -> list[Employee]:
        return sorted(self._employees.values(), key=lambda item: item.employee_number)


class DepartmentRepository:
    def __init__(self, departments: list[Department] | None = None) -> None:
        self._departments = {item.id: item for item in departments or []}

    def exists(self, department_id: str) -> bool:
        return department_id in self._departments


class LeaveRepository:
    def __init__(self) -> None:
        self._requests: list[LeaveRequest] = []

    def save(self, request: LeaveRequest) -> LeaveRequest:
        self._requests.append(request)
        return request
