from app.hr.models import Employee
from app.hr.schemas import EmployeeResponse


def to_employee_response(employee: Employee) -> EmployeeResponse:
    return EmployeeResponse(
        id=employee.id,
        employee_number=employee.employee_number,
        full_name=employee.full_name,
        email=employee.email,
        department_id=employee.department_id,
        employment_type=employee.employment_type,
        status=employee.status,
        annual_salary=employee.compensation.annual_salary,
        currency=employee.compensation.currency,
        skills=set(employee.skills),
    )
