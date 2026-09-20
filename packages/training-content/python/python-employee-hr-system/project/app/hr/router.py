from decimal import Decimal

from fastapi import APIRouter, Query, status

from app.hr.compensation import PercentageIncreasePolicy
from app.hr.mappers import to_employee_response
from app.hr.models import Department
from app.hr.repositories import DepartmentRepository, InMemoryEmployeeRepository, LeaveRepository
from app.hr.schemas import EmployeeCreateRequest, EmployeeResponse, LeaveCreateRequest
from app.hr.services import EmployeeService
from app.security.dependencies import CurrentUserDependency


router = APIRouter(prefix="/api/employees", tags=["employees"])
service = EmployeeService(
    InMemoryEmployeeRepository(),
    DepartmentRepository([Department("engineering", "ENG", "Engineering")]),
    LeaveRepository(),
    PercentageIncreasePolicy(),
)


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    request: EmployeeCreateRequest, user: CurrentUserDependency
) -> EmployeeResponse:
    return to_employee_response(service.create(request))


@router.get("", response_model=list[EmployeeResponse])
async def list_employees(user: CurrentUserDependency) -> list[EmployeeResponse]:
    return [to_employee_response(item) for item in service.list_all()]


@router.patch("/{employee_id}/salary", response_model=EmployeeResponse)
async def increase_salary(
    employee_id: str,
    user: CurrentUserDependency,
    percentage: Decimal = Query(gt=0, le=25),
) -> EmployeeResponse:
    return to_employee_response(service.increase_salary(employee_id, percentage))


@router.post("/{employee_id}/leave", status_code=status.HTTP_201_CREATED)
async def request_leave(
    employee_id: str, request: LeaveCreateRequest, user: CurrentUserDependency
) -> dict[str, str]:
    leave = service.request_leave(employee_id, request)
    return {"id": leave.id, "employee_id": leave.employee_id}
