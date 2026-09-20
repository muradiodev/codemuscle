/**
 * Generates four Python 3.12 / FastAPI practice projects as on-disk source trees.
 * Run: node scripts/generate-python-projects.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "python");

function write(projectDir, relative, content) {
  const path = join(projectDir, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.replace(/\r?\n/g, "\n"), "utf8");
}

const commonFiles = (title, domainRouter) => [
  {
    path: "app/main.py",
    difficulty: "warmup",
    topics: ["fastapi", "application-factory", "routing"],
    code: `from fastapi import FastAPI

from app.config import settings
from app.exceptions import install_exception_handlers
from app.security.router import router as auth_router
from ${domainRouter} import router as domain_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.0")
    install_exception_handlers(app)
    app.include_router(auth_router)
    app.include_router(domain_router)

    @app.get("/health", tags=["system"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.app_name}

    return app


app = create_app()
`
  },
  {
    path: "app/config.py",
    difficulty: "warmup",
    topics: ["pydantic-settings", "configuration", "environment"],
    code: `from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "${title}"
    jwt_secret: str = "codemuscle-local-python-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60

    model_config = SettingsConfigDict(env_prefix="CODEMUSCLE_", env_file=".env")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
`
  },
  {
    path: "app/exceptions.py",
    difficulty: "intermediate",
    topics: ["fastapi", "exception-handling", "http"],
    code: `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class DomainError(Exception):
    status_code = 400
    code = "DOMAIN_ERROR"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFoundError(DomainError):
    status_code = 404
    code = "NOT_FOUND"


class ConflictError(DomainError):
    status_code = 409
    code = "CONFLICT"


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(
        request: Request, error: DomainError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=error.status_code,
            content={"error": {"code": error.code, "message": error.message}},
        )
`
  },
  {
    path: "app/security/models.py",
    difficulty: "intermediate",
    topics: ["dataclasses", "security", "immutability"],
    code: `from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass(frozen=True, slots=True)
class PlatformUser:
    id: str
    username: str
    password_hash: str
    email: str
    display_name: str
    job_title: str | None = None
    locale: str = "en"
    roles: frozenset[str] = frozenset({"user"})
    enabled: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
`
  },
  {
    path: "app/security/schemas.py",
    difficulty: "warmup",
    topics: ["pydantic", "validation", "authentication"],
    code: `from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=60, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(min_length=10, max_length=100)
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=100)
    job_title: str | None = Field(default=None, max_length=100)
    locale: str = Field(default="en", min_length=2, max_length=10)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=1, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    username: str
    display_name: str
    roles: set[str]


class CurrentUser(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    username: str
    display_name: str
    roles: set[str]
`
  },
  {
    path: "app/security/repository.py",
    difficulty: "intermediate",
    topics: ["repository-pattern", "thread-safety", "collections"],
    code: `from threading import RLock

from app.exceptions import ConflictError
from app.security.models import PlatformUser


class UserRepository:
    def __init__(self) -> None:
        self._users: dict[str, PlatformUser] = {}
        self._lock = RLock()

    def save(self, user: PlatformUser) -> PlatformUser:
        key = user.username.casefold()
        with self._lock:
            if key in self._users:
                raise ConflictError("Username is already registered")
            self._users[key] = user
        return user

    def find_by_username(self, username: str) -> PlatformUser | None:
        with self._lock:
            return self._users.get(username.casefold())
`
  },
  {
    path: "app/security/passwords.py",
    difficulty: "advanced",
    topics: ["security", "password-hashing", "scrypt"],
    code: `import base64
import hashlib
import hmac
import secrets


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32
    )
    return "scrypt$16384$8$1$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(digest).decode()


def verify_password(password: str, encoded: str) -> bool:
    algorithm, n, r, p, salt_text, digest_text = encoded.split("$", 5)
    if algorithm != "scrypt":
        return False
    salt = base64.b64decode(salt_text)
    expected = base64.b64decode(digest_text)
    actual = hashlib.scrypt(
        password.encode(), salt=salt, n=int(n), r=int(r), p=int(p), dklen=32
    )
    return hmac.compare_digest(actual, expected)
`
  },
  {
    path: "app/security/service.py",
    difficulty: "advanced",
    topics: ["jwt", "authentication", "services"],
    code: `from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt

from app.config import Settings
from app.security.models import PlatformUser
from app.security.passwords import hash_password, verify_password
from app.security.repository import UserRepository
from app.security.schemas import LoginRequest, RegisterRequest, TokenResponse


class AuthenticationError(ValueError):
    pass


class AuthenticationService:
    def __init__(self, repository: UserRepository, settings: Settings) -> None:
        self._repository = repository
        self._settings = settings

    def register(self, request: RegisterRequest) -> TokenResponse:
        user = PlatformUser(
            id=str(uuid4()),
            username=request.username,
            password_hash=hash_password(request.password),
            email=str(request.email),
            display_name=request.display_name,
            job_title=request.job_title,
            locale=request.locale,
        )
        return self._issue(self._repository.save(user))

    def login(self, request: LoginRequest) -> TokenResponse:
        user = self._repository.find_by_username(request.username)
        if user is None or not user.enabled or not verify_password(request.password, user.password_hash):
            raise AuthenticationError("Invalid username or password")
        return self._issue(user)

    def decode(self, token: str) -> dict[str, object]:
        return jwt.decode(
            token,
            self._settings.jwt_secret,
            algorithms=[self._settings.jwt_algorithm],
            options={"require": ["exp", "iat", "sub"]},
        )

    def _issue(self, user: PlatformUser) -> TokenResponse:
        issued_at = datetime.now(UTC)
        expires_at = issued_at + timedelta(minutes=self._settings.access_token_minutes)
        claims = {
            "sub": user.username,
            "user_id": user.id,
            "display_name": user.display_name,
            "roles": sorted(user.roles),
            "iat": issued_at,
            "exp": expires_at,
        }
        token = jwt.encode(claims, self._settings.jwt_secret, algorithm=self._settings.jwt_algorithm)
        return TokenResponse(
            access_token=token,
            expires_at=expires_at,
            username=user.username,
            display_name=user.display_name,
            roles=set(user.roles),
        )
`
  },
  {
    path: "app/security/container.py",
    difficulty: "warmup",
    topics: ["dependency-injection", "composition-root"],
    code: `from app.config import settings
from app.security.repository import UserRepository
from app.security.service import AuthenticationService


user_repository = UserRepository()
authentication_service = AuthenticationService(user_repository, settings)
`
  },
  {
    path: "app/security/dependencies.py",
    difficulty: "advanced",
    topics: ["fastapi", "oauth2", "dependency-injection"],
    code: `from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError

from app.security.container import authentication_service
from app.security.schemas import CurrentUser


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> CurrentUser:
    try:
        claims = authentication_service.decode(token)
        return CurrentUser(
            id=str(claims["user_id"]),
            username=str(claims["sub"]),
            display_name=str(claims["display_name"]),
            roles=set(claims.get("roles", [])),
        )
    except (InvalidTokenError, KeyError, TypeError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error


CurrentUserDependency = Annotated[CurrentUser, Depends(get_current_user)]
`
  },
  {
    path: "app/security/router.py",
    difficulty: "intermediate",
    topics: ["fastapi", "routing", "authentication"],
    code: `from fastapi import APIRouter, HTTPException, status

from app.security.container import authentication_service
from app.security.dependencies import CurrentUserDependency
from app.security.schemas import CurrentUser, LoginRequest, RegisterRequest, TokenResponse
from app.security.service import AuthenticationError


router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest) -> TokenResponse:
    return authentication_service.register(request)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest) -> TokenResponse:
    try:
        return authentication_service.login(request)
    except AuthenticationError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error


@router.get("/me", response_model=CurrentUser)
async def current_user(user: CurrentUserDependency) -> CurrentUser:
    return user
`
  }
];

const hrFiles = [
  {
    path: "app/hr/models.py", difficulty: "intermediate", topics: ["dataclasses", "enums", "domain-modeling"], code: `from dataclasses import dataclass, field, replace
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
`
  },
  {
    path: "app/hr/schemas.py", difficulty: "warmup", topics: ["pydantic", "validation", "dto"], code: `from datetime import date
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
`
  },
  {
    path: "app/hr/repositories.py", difficulty: "intermediate", topics: ["repository-pattern", "protocols", "collections"], code: `from typing import Protocol

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
`
  },
  {
    path: "app/hr/compensation.py", difficulty: "advanced", topics: ["strategy-pattern", "decimal", "business-rules"], code: `from decimal import Decimal, ROUND_HALF_UP
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
`
  },
  {
    path: "app/hr/mappers.py", difficulty: "warmup", topics: ["mapping", "dto"], code: `from app.hr.models import Employee
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
`
  },
  {
    path: "app/hr/services.py", difficulty: "advanced", topics: ["services", "business-rules", "dependency-injection"], code: `from datetime import date
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
`
  },
  {
    path: "app/hr/analytics.py", difficulty: "intermediate", topics: ["aggregation", "statistics", "decimal"], code: `from collections import Counter
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
`
  },
  {
    path: "app/hr/router.py", difficulty: "advanced", topics: ["fastapi", "rest", "dependency-injection"], code: `from decimal import Decimal

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
`
  }
];

const logisticsFiles = [
  {
    path: "app/logistics/models.py", difficulty: "intermediate", topics: ["dataclasses", "enums", "domain-modeling"], code: `from dataclasses import dataclass, field, replace
from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum


class ShipmentStatus(StrEnum):
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class DeliveryPriority(StrEnum):
    STANDARD = "standard"
    EXPRESS = "express"
    SAME_DAY = "same_day"


@dataclass(frozen=True, slots=True)
class PackageItem:
    sku: str
    description: str
    quantity: int
    unit_weight_kg: Decimal

    @property
    def total_weight_kg(self) -> Decimal:
        return self.unit_weight_kg * self.quantity


@dataclass(frozen=True, slots=True)
class Warehouse:
    id: str
    code: str
    city: str
    country: str


@dataclass(frozen=True, slots=True)
class TrackingEvent:
    status: ShipmentStatus
    location: str
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass(frozen=True, slots=True)
class Shipment:
    id: str
    tracking_number: str
    origin_warehouse_id: str
    destination: str
    priority: DeliveryPriority
    items: tuple[PackageItem, ...]
    shipping_cost: Decimal
    status: ShipmentStatus = ShipmentStatus.CREATED
    events: tuple[TrackingEvent, ...] = ()

    @property
    def total_weight_kg(self) -> Decimal:
        return sum((item.total_weight_kg for item in self.items), start=Decimal("0"))

    def record(self, event: TrackingEvent) -> "Shipment":
        return replace(self, status=event.status, events=(*self.events, event))
`
  },
  {
    path: "app/logistics/schemas.py", difficulty: "warmup", topics: ["pydantic", "validation", "dto"], code: `from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.logistics.models import DeliveryPriority, ShipmentStatus


class PackageItemInput(BaseModel):
    sku: str = Field(min_length=1, max_length=60)
    description: str = Field(min_length=1, max_length=200)
    quantity: int = Field(gt=0)
    unit_weight_kg: Decimal = Field(gt=0)


class ShipmentCreateRequest(BaseModel):
    origin_warehouse_id: str
    destination: str = Field(min_length=3, max_length=300)
    priority: DeliveryPriority = DeliveryPriority.STANDARD
    distance_km: Decimal = Field(gt=0)
    items: list[PackageItemInput] = Field(min_length=1)


class TrackingEventRequest(BaseModel):
    status: ShipmentStatus
    location: str = Field(min_length=2, max_length=200)


class ShipmentResponse(BaseModel):
    id: str
    tracking_number: str
    origin_warehouse_id: str
    destination: str
    priority: DeliveryPriority
    total_weight_kg: Decimal
    shipping_cost: Decimal
    status: ShipmentStatus
    event_count: int
    last_updated_at: datetime | None
`
  },
  {
    path: "app/logistics/repositories.py", difficulty: "intermediate", topics: ["repository-pattern", "protocols", "collections"], code: `from typing import Protocol

from app.logistics.models import Shipment, Warehouse


class ShipmentRepository(Protocol):
    def save(self, shipment: Shipment) -> Shipment: ...
    def find_by_id(self, shipment_id: str) -> Shipment | None: ...
    def find_all(self) -> list[Shipment]: ...


class InMemoryShipmentRepository:
    def __init__(self) -> None:
        self._shipments: dict[str, Shipment] = {}

    def save(self, shipment: Shipment) -> Shipment:
        self._shipments[shipment.id] = shipment
        return shipment

    def find_by_id(self, shipment_id: str) -> Shipment | None:
        return self._shipments.get(shipment_id)

    def find_all(self) -> list[Shipment]:
        return list(self._shipments.values())


class WarehouseRepository:
    def __init__(self, warehouses: list[Warehouse] | None = None) -> None:
        self._warehouses = {warehouse.id: warehouse for warehouse in warehouses or []}

    def find_by_id(self, warehouse_id: str) -> Warehouse | None:
        return self._warehouses.get(warehouse_id)
`
  },
  {
    path: "app/logistics/strategies.py", difficulty: "advanced", topics: ["strategy-pattern", "decimal", "business-rules"], code: `from decimal import Decimal, ROUND_HALF_UP
from typing import Protocol

from app.logistics.models import DeliveryPriority


class ShippingCostStrategy(Protocol):
    def calculate(self, weight_kg: Decimal, distance_km: Decimal, priority: DeliveryPriority) -> Decimal: ...


class WeightDistanceShippingCost:
    _multipliers = {
        DeliveryPriority.STANDARD: Decimal("1.0"),
        DeliveryPriority.EXPRESS: Decimal("1.65"),
        DeliveryPriority.SAME_DAY: Decimal("2.40"),
    }

    def calculate(
        self, weight_kg: Decimal, distance_km: Decimal, priority: DeliveryPriority
    ) -> Decimal:
        base = Decimal("4.50") + weight_kg * Decimal("0.85")
        distance_charge = distance_km * Decimal("0.035")
        total = (base + distance_charge) * self._multipliers[priority]
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
`
  },
  {
    path: "app/logistics/mappers.py", difficulty: "warmup", topics: ["mapping", "dto"], code: `from app.logistics.models import Shipment
from app.logistics.schemas import ShipmentResponse


def to_shipment_response(shipment: Shipment) -> ShipmentResponse:
    latest = shipment.events[-1].occurred_at if shipment.events else None
    return ShipmentResponse(
        id=shipment.id,
        tracking_number=shipment.tracking_number,
        origin_warehouse_id=shipment.origin_warehouse_id,
        destination=shipment.destination,
        priority=shipment.priority,
        total_weight_kg=shipment.total_weight_kg,
        shipping_cost=shipment.shipping_cost,
        status=shipment.status,
        event_count=len(shipment.events),
        last_updated_at=latest,
    )
`
  },
  {
    path: "app/logistics/services.py", difficulty: "advanced", topics: ["services", "business-rules", "dependency-injection"], code: `from uuid import uuid4

from app.exceptions import NotFoundError
from app.logistics.models import PackageItem, Shipment, ShipmentStatus, TrackingEvent
from app.logistics.repositories import ShipmentRepository, WarehouseRepository
from app.logistics.schemas import ShipmentCreateRequest, TrackingEventRequest
from app.logistics.strategies import ShippingCostStrategy


class ShipmentService:
    def __init__(
        self,
        shipments: ShipmentRepository,
        warehouses: WarehouseRepository,
        cost_strategy: ShippingCostStrategy,
    ) -> None:
        self._shipments = shipments
        self._warehouses = warehouses
        self._cost_strategy = cost_strategy

    def create(self, request: ShipmentCreateRequest) -> Shipment:
        if self._warehouses.find_by_id(request.origin_warehouse_id) is None:
            raise NotFoundError("Origin warehouse was not found")
        shipment_id = str(uuid4())
        items = tuple(PackageItem(**item.model_dump()) for item in request.items)
        weight = sum((item.total_weight_kg for item in items), start=0)
        shipment = Shipment(
            id=shipment_id,
            tracking_number=f"CM{shipment_id.replace('-', '')[:12].upper()}",
            origin_warehouse_id=request.origin_warehouse_id,
            destination=request.destination,
            priority=request.priority,
            items=items,
            shipping_cost=self._cost_strategy.calculate(weight, request.distance_km, request.priority),
        )
        return self._shipments.save(shipment)

    def get(self, shipment_id: str) -> Shipment:
        shipment = self._shipments.find_by_id(shipment_id)
        if shipment is None:
            raise NotFoundError("Shipment was not found")
        return shipment

    def list_all(self) -> list[Shipment]:
        return self._shipments.find_all()

    def track(self, shipment_id: str, request: TrackingEventRequest) -> Shipment:
        shipment = self.get(shipment_id)
        if shipment.status in {ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED}:
            raise ValueError("A final shipment cannot receive tracking events")
        return self._shipments.save(
            shipment.record(TrackingEvent(request.status, request.location))
        )
`
  },
  {
    path: "app/logistics/analytics.py", difficulty: "intermediate", topics: ["aggregation", "statistics", "collections"], code: `from collections import Counter
from decimal import Decimal

from app.logistics.models import Shipment, ShipmentStatus


def shipments_by_status(shipments: list[Shipment]) -> dict[ShipmentStatus, int]:
    counts = Counter(shipment.status for shipment in shipments)
    return {status: counts.get(status, 0) for status in ShipmentStatus}


def total_revenue(shipments: list[Shipment]) -> Decimal:
    return sum(
        (shipment.shipping_cost for shipment in shipments if shipment.status != ShipmentStatus.CANCELLED),
        start=Decimal("0"),
    )
`
  },
  {
    path: "app/logistics/router.py", difficulty: "advanced", topics: ["fastapi", "rest", "dependency-injection"], code: `from fastapi import APIRouter, status

from app.logistics.mappers import to_shipment_response
from app.logistics.models import Warehouse
from app.logistics.repositories import InMemoryShipmentRepository, WarehouseRepository
from app.logistics.schemas import ShipmentCreateRequest, ShipmentResponse, TrackingEventRequest
from app.logistics.services import ShipmentService
from app.logistics.strategies import WeightDistanceShippingCost
from app.security.dependencies import CurrentUserDependency


router = APIRouter(prefix="/api/shipments", tags=["shipments"])
service = ShipmentService(
    InMemoryShipmentRepository(),
    WarehouseRepository([Warehouse("berlin", "BER-01", "Berlin", "DE")]),
    WeightDistanceShippingCost(),
)


@router.post("", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_shipment(
    request: ShipmentCreateRequest, user: CurrentUserDependency
) -> ShipmentResponse:
    return to_shipment_response(service.create(request))


@router.get("", response_model=list[ShipmentResponse])
async def list_shipments(user: CurrentUserDependency) -> list[ShipmentResponse]:
    return [to_shipment_response(item) for item in service.list_all()]


@router.get("/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(shipment_id: str, user: CurrentUserDependency) -> ShipmentResponse:
    return to_shipment_response(service.get(shipment_id))


@router.post("/{shipment_id}/events", response_model=ShipmentResponse)
async def add_tracking_event(
    shipment_id: str, request: TrackingEventRequest, user: CurrentUserDependency
) -> ShipmentResponse:
    return to_shipment_response(service.track(shipment_id, request))
`
  }
];

const energyFiles = [
  {
    path: "app/energy/models.py", difficulty: "intermediate", topics: ["dataclasses", "enums", "domain-modeling"], code: `from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum


class BillingStatus(StrEnum):
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


@dataclass(frozen=True, slots=True)
class GridArea:
    id: str
    code: str
    timezone: str


@dataclass(frozen=True, slots=True)
class Customer:
    id: str
    account_number: str
    name: str
    email: str


@dataclass(frozen=True, slots=True)
class Meter:
    id: str
    serial_number: str
    customer_id: str
    grid_area_id: str


@dataclass(frozen=True, slots=True)
class MeterReading:
    id: str
    meter_id: str
    recorded_at: datetime
    value_kwh: Decimal


@dataclass(frozen=True, slots=True)
class Tariff:
    id: str
    name: str
    unit_rate: Decimal
    standing_charge: Decimal
    tax_rate: Decimal


@dataclass(frozen=True, slots=True)
class Invoice:
    id: str
    customer_id: str
    meter_id: str
    period_start: date
    period_end: date
    consumption_kwh: Decimal
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    status: BillingStatus = BillingStatus.ISSUED
`
  },
  {
    path: "app/energy/schemas.py", difficulty: "warmup", topics: ["pydantic", "validation", "dto"], code: `from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.energy.models import BillingStatus


class ReadingIngestRequest(BaseModel):
    meter_id: str
    recorded_at: datetime
    value_kwh: Decimal = Field(ge=0)


class InvoiceCreateRequest(BaseModel):
    meter_id: str
    tariff_id: str
    period_start: date
    period_end: date

    @model_validator(mode="after")
    def dates_are_ordered(self) -> "InvoiceCreateRequest":
        if self.period_end <= self.period_start:
            raise ValueError("period_end must be after period_start")
        return self


class InvoiceResponse(BaseModel):
    id: str
    customer_id: str
    meter_id: str
    period_start: date
    period_end: date
    consumption_kwh: Decimal
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    status: BillingStatus
`
  },
  {
    path: "app/energy/repositories.py", difficulty: "intermediate", topics: ["repository-pattern", "protocols", "collections"], code: `from datetime import datetime

from app.energy.models import Invoice, Meter, MeterReading, Tariff


class MeterReadingRepository:
    def __init__(self) -> None:
        self._readings: list[MeterReading] = []

    def save(self, reading: MeterReading) -> MeterReading:
        self._readings.append(reading)
        return reading

    def between(self, meter_id: str, start: datetime, end: datetime) -> list[MeterReading]:
        return sorted(
            (
                item
                for item in self._readings
                if item.meter_id == meter_id and start <= item.recorded_at <= end
            ),
            key=lambda item: item.recorded_at,
        )


class MeterRepository:
    def __init__(self, meters: list[Meter] | None = None) -> None:
        self._meters = {meter.id: meter for meter in meters or []}

    def find_by_id(self, meter_id: str) -> Meter | None:
        return self._meters.get(meter_id)


class TariffRepository:
    def __init__(self, tariffs: list[Tariff] | None = None) -> None:
        self._tariffs = {tariff.id: tariff for tariff in tariffs or []}

    def find_by_id(self, tariff_id: str) -> Tariff | None:
        return self._tariffs.get(tariff_id)


class InvoiceRepository:
    def __init__(self) -> None:
        self._invoices: dict[str, Invoice] = {}

    def save(self, invoice: Invoice) -> Invoice:
        self._invoices[invoice.id] = invoice
        return invoice

    def find_all(self) -> list[Invoice]:
        return list(self._invoices.values())
`
  },
  {
    path: "app/energy/strategies.py", difficulty: "advanced", topics: ["strategy-pattern", "decimal", "billing"], code: `from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Protocol

from app.energy.models import Tariff


@dataclass(frozen=True, slots=True)
class ChargeBreakdown:
    subtotal: Decimal
    tax: Decimal
    total: Decimal


class TariffCalculationStrategy(Protocol):
    def calculate(self, consumption_kwh: Decimal, tariff: Tariff) -> ChargeBreakdown: ...


class StandardTariffCalculation:
    def calculate(self, consumption_kwh: Decimal, tariff: Tariff) -> ChargeBreakdown:
        money = Decimal("0.01")
        subtotal = (consumption_kwh * tariff.unit_rate + tariff.standing_charge).quantize(
            money, rounding=ROUND_HALF_UP
        )
        tax = (subtotal * tariff.tax_rate).quantize(money, rounding=ROUND_HALF_UP)
        return ChargeBreakdown(subtotal=subtotal, tax=tax, total=subtotal + tax)
`
  },
  {
    path: "app/energy/mappers.py", difficulty: "warmup", topics: ["mapping", "dto"], code: `from app.energy.models import Invoice
from app.energy.schemas import InvoiceResponse


def to_invoice_response(invoice: Invoice) -> InvoiceResponse:
    return InvoiceResponse(
        id=invoice.id,
        customer_id=invoice.customer_id,
        meter_id=invoice.meter_id,
        period_start=invoice.period_start,
        period_end=invoice.period_end,
        consumption_kwh=invoice.consumption_kwh,
        subtotal=invoice.subtotal,
        tax=invoice.tax,
        total=invoice.total,
        status=invoice.status,
    )
`
  },
  {
    path: "app/energy/services.py", difficulty: "advanced", topics: ["services", "billing", "dependency-injection"], code: `from datetime import UTC, datetime, time
from decimal import Decimal
from uuid import uuid4

from app.energy.models import Invoice, MeterReading
from app.energy.repositories import InvoiceRepository, MeterReadingRepository, MeterRepository, TariffRepository
from app.energy.schemas import InvoiceCreateRequest, ReadingIngestRequest
from app.energy.strategies import TariffCalculationStrategy
from app.exceptions import NotFoundError


class BillingService:
    def __init__(
        self,
        readings: MeterReadingRepository,
        meters: MeterRepository,
        tariffs: TariffRepository,
        invoices: InvoiceRepository,
        calculation: TariffCalculationStrategy,
    ) -> None:
        self._readings = readings
        self._meters = meters
        self._tariffs = tariffs
        self._invoices = invoices
        self._calculation = calculation

    def ingest(self, request: ReadingIngestRequest) -> MeterReading:
        if self._meters.find_by_id(request.meter_id) is None:
            raise NotFoundError("Meter was not found")
        reading = MeterReading(str(uuid4()), request.meter_id, request.recorded_at, request.value_kwh)
        return self._readings.save(reading)

    def create_invoice(self, request: InvoiceCreateRequest) -> Invoice:
        meter = self._meters.find_by_id(request.meter_id)
        tariff = self._tariffs.find_by_id(request.tariff_id)
        if meter is None:
            raise NotFoundError("Meter was not found")
        if tariff is None:
            raise NotFoundError("Tariff was not found")
        start = datetime.combine(request.period_start, time.min, tzinfo=UTC)
        end = datetime.combine(request.period_end, time.max, tzinfo=UTC)
        values = self._readings.between(meter.id, start, end)
        consumption = values[-1].value_kwh - values[0].value_kwh if len(values) >= 2 else Decimal("0")
        if consumption < 0:
            raise ValueError("Meter readings cannot move backwards")
        charges = self._calculation.calculate(consumption, tariff)
        invoice = Invoice(
            str(uuid4()), meter.customer_id, meter.id, request.period_start, request.period_end,
            consumption, charges.subtotal, charges.tax, charges.total,
        )
        return self._invoices.save(invoice)

    def list_invoices(self) -> list[Invoice]:
        return self._invoices.find_all()
`
  },
  {
    path: "app/energy/analytics.py", difficulty: "intermediate", topics: ["aggregation", "time-series", "decimal"], code: `from collections import defaultdict
from datetime import date
from decimal import Decimal

from app.energy.models import MeterReading


def daily_consumption(readings: list[MeterReading]) -> dict[date, Decimal]:
    grouped: dict[date, list[MeterReading]] = defaultdict(list)
    for reading in readings:
        grouped[reading.recorded_at.date()].append(reading)
    return {
        day: max(items, key=lambda item: item.recorded_at).value_kwh
        - min(items, key=lambda item: item.recorded_at).value_kwh
        for day, items in grouped.items()
        if len(items) >= 2
    }
`
  },
  {
    path: "app/energy/router.py", difficulty: "advanced", topics: ["fastapi", "rest", "dependency-injection"], code: `from decimal import Decimal

from fastapi import APIRouter, status

from app.energy.mappers import to_invoice_response
from app.energy.models import Meter, Tariff
from app.energy.repositories import InvoiceRepository, MeterReadingRepository, MeterRepository, TariffRepository
from app.energy.schemas import InvoiceCreateRequest, InvoiceResponse, ReadingIngestRequest
from app.energy.services import BillingService
from app.energy.strategies import StandardTariffCalculation
from app.security.dependencies import CurrentUserDependency


router = APIRouter(prefix="/api/billing", tags=["billing"])
service = BillingService(
    MeterReadingRepository(),
    MeterRepository([Meter("meter-1", "BER-10001", "customer-1", "berlin")]),
    TariffRepository([Tariff("standard", "Standard", Decimal("0.31"), Decimal("12.00"), Decimal("0.19"))]),
    InvoiceRepository(),
    StandardTariffCalculation(),
)


@router.post("/readings", status_code=status.HTTP_202_ACCEPTED)
async def ingest_reading(
    request: ReadingIngestRequest, user: CurrentUserDependency
) -> dict[str, str]:
    reading = service.ingest(request)
    return {"id": reading.id, "meter_id": reading.meter_id}


@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    request: InvoiceCreateRequest, user: CurrentUserDependency
) -> InvoiceResponse:
    return to_invoice_response(service.create_invoice(request))


@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(user: CurrentUserDependency) -> list[InvoiceResponse]:
    return [to_invoice_response(item) for item in service.list_invoices()]
`
  }
];

const saasFiles = [
  {
    path: "app/saas/models.py", difficulty: "intermediate", topics: ["dataclasses", "enums", "domain-modeling"], code: `from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from enum import StrEnum


class TenantStatus(StrEnum):
    TRIAL = "trial"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


class Role(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class Permission(StrEnum):
    MANAGE_BILLING = "manage_billing"
    MANAGE_USERS = "manage_users"
    WRITE_DATA = "write_data"
    READ_DATA = "read_data"


@dataclass(frozen=True, slots=True)
class Plan:
    code: str
    name: str
    monthly_price_cents: int
    included_seats: int
    features: frozenset[str] = field(default_factory=frozenset)


@dataclass(frozen=True, slots=True)
class Tenant:
    id: str
    slug: str
    name: str
    status: TenantStatus
    plan_code: str
    owner_user_id: str
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass(frozen=True, slots=True)
class Subscription:
    tenant_id: str
    plan_code: str
    starts_on: date
    renews_on: date
    seat_count: int


@dataclass(frozen=True, slots=True)
class UsageRecord:
    tenant_id: str
    feature: str
    quantity: int
    recorded_at: datetime = field(default_factory=lambda: datetime.now(UTC))
`
  },
  {
    path: "app/saas/context.py", difficulty: "advanced", topics: ["contextvars", "multi-tenancy", "request-context"], code: `from contextlib import contextmanager
from contextvars import ContextVar, Token
from collections.abc import Iterator


_current_tenant: ContextVar[str | None] = ContextVar("current_tenant", default=None)


class TenantContext:
    @staticmethod
    def current() -> str:
        tenant_id = _current_tenant.get()
        if tenant_id is None:
            raise RuntimeError("No tenant is bound to the current context")
        return tenant_id

    @staticmethod
    @contextmanager
    def bind(tenant_id: str) -> Iterator[None]:
        token: Token[str | None] = _current_tenant.set(tenant_id)
        try:
            yield
        finally:
            _current_tenant.reset(token)
`
  },
  {
    path: "app/saas/schemas.py", difficulty: "warmup", topics: ["pydantic", "validation", "dto"], code: `from datetime import datetime

from pydantic import BaseModel, Field

from app.saas.models import TenantStatus


class TenantCreateRequest(BaseModel):
    slug: str = Field(min_length=3, max_length=50, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: str = Field(min_length=2, max_length=120)
    plan_code: str = Field(min_length=2, max_length=40)


class UsageRecordRequest(BaseModel):
    feature: str = Field(min_length=2, max_length=80)
    quantity: int = Field(gt=0)


class TenantResponse(BaseModel):
    id: str
    slug: str
    name: str
    status: TenantStatus
    plan_code: str
    owner_user_id: str
    created_at: datetime
    enabled_features: set[str]
`
  },
  {
    path: "app/saas/repositories.py", difficulty: "intermediate", topics: ["repository-pattern", "multi-tenancy", "collections"], code: `from app.exceptions import ConflictError
from app.saas.models import Plan, Tenant, UsageRecord


class TenantRepository:
    def __init__(self) -> None:
        self._tenants: dict[str, Tenant] = {}
        self._ids_by_slug: dict[str, str] = {}

    def save(self, tenant: Tenant) -> Tenant:
        existing_id = self._ids_by_slug.get(tenant.slug)
        if existing_id is not None and existing_id != tenant.id:
            raise ConflictError("Tenant slug is already in use")
        self._tenants[tenant.id] = tenant
        self._ids_by_slug[tenant.slug] = tenant.id
        return tenant

    def find_by_id(self, tenant_id: str) -> Tenant | None:
        return self._tenants.get(tenant_id)

    def find_all(self) -> list[Tenant]:
        return sorted(self._tenants.values(), key=lambda tenant: tenant.name.casefold())


class PlanRepository:
    def __init__(self, plans: list[Plan] | None = None) -> None:
        self._plans = {plan.code: plan for plan in plans or []}

    def find_by_code(self, code: str) -> Plan | None:
        return self._plans.get(code)


class UsageRepository:
    def __init__(self) -> None:
        self._records: list[UsageRecord] = []

    def save(self, record: UsageRecord) -> UsageRecord:
        self._records.append(record)
        return record

    def for_tenant(self, tenant_id: str) -> list[UsageRecord]:
        return [record for record in self._records if record.tenant_id == tenant_id]
`
  },
  {
    path: "app/saas/features.py", difficulty: "advanced", topics: ["feature-flags", "services", "business-rules"], code: `from app.saas.models import Tenant, TenantStatus
from app.saas.repositories import PlanRepository


class TenantFeatureService:
    def __init__(self, plans: PlanRepository) -> None:
        self._plans = plans

    def enabled_features(self, tenant: Tenant) -> frozenset[str]:
        if tenant.status in {TenantStatus.SUSPENDED, TenantStatus.CANCELLED}:
            return frozenset()
        plan = self._plans.find_by_code(tenant.plan_code)
        return plan.features if plan is not None else frozenset()

    def require(self, tenant: Tenant, feature: str) -> None:
        if feature not in self.enabled_features(tenant):
            raise PermissionError(f"Feature '{feature}' is not enabled for this tenant")
`
  },
  {
    path: "app/saas/mappers.py", difficulty: "warmup", topics: ["mapping", "dto"], code: `from app.saas.features import TenantFeatureService
from app.saas.models import Tenant
from app.saas.schemas import TenantResponse


def to_tenant_response(
    tenant: Tenant, features: TenantFeatureService
) -> TenantResponse:
    return TenantResponse(
        id=tenant.id,
        slug=tenant.slug,
        name=tenant.name,
        status=tenant.status,
        plan_code=tenant.plan_code,
        owner_user_id=tenant.owner_user_id,
        created_at=tenant.created_at,
        enabled_features=set(features.enabled_features(tenant)),
    )
`
  },
  {
    path: "app/saas/services.py", difficulty: "advanced", topics: ["services", "multi-tenancy", "dependency-injection"], code: `from uuid import uuid4

from app.exceptions import NotFoundError
from app.saas.features import TenantFeatureService
from app.saas.models import Tenant, TenantStatus, UsageRecord
from app.saas.repositories import PlanRepository, TenantRepository, UsageRepository
from app.saas.schemas import TenantCreateRequest, UsageRecordRequest


class TenantService:
    def __init__(
        self,
        tenants: TenantRepository,
        plans: PlanRepository,
        usage: UsageRepository,
        features: TenantFeatureService,
    ) -> None:
        self._tenants = tenants
        self._plans = plans
        self._usage = usage
        self._features = features

    def create(self, request: TenantCreateRequest, owner_user_id: str) -> Tenant:
        if self._plans.find_by_code(request.plan_code) is None:
            raise NotFoundError("Plan was not found")
        tenant = Tenant(
            id=str(uuid4()),
            slug=request.slug,
            name=request.name,
            status=TenantStatus.TRIAL,
            plan_code=request.plan_code,
            owner_user_id=owner_user_id,
        )
        return self._tenants.save(tenant)

    def get(self, tenant_id: str) -> Tenant:
        tenant = self._tenants.find_by_id(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant was not found")
        return tenant

    def list_all(self) -> list[Tenant]:
        return self._tenants.find_all()

    def record_usage(self, tenant_id: str, request: UsageRecordRequest) -> UsageRecord:
        tenant = self.get(tenant_id)
        self._features.require(tenant, request.feature)
        return self._usage.save(UsageRecord(tenant.id, request.feature, request.quantity))
`
  },
  {
    path: "app/saas/analytics.py", difficulty: "intermediate", topics: ["aggregation", "multi-tenancy", "collections"], code: `from collections import defaultdict

from app.saas.models import UsageRecord


def aggregate_usage(records: list[UsageRecord]) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)
    for record in records:
        totals[record.feature] += record.quantity
    return dict(sorted(totals.items()))


def exceeds_limit(records: list[UsageRecord], feature: str, limit: int) -> bool:
    consumed = sum(record.quantity for record in records if record.feature == feature)
    return consumed > limit
`
  },
  {
    path: "app/saas/router.py", difficulty: "advanced", topics: ["fastapi", "rest", "multi-tenancy"], code: `from fastapi import APIRouter, status

from app.saas.features import TenantFeatureService
from app.saas.mappers import to_tenant_response
from app.saas.models import Plan
from app.saas.repositories import PlanRepository, TenantRepository, UsageRepository
from app.saas.schemas import TenantCreateRequest, TenantResponse, UsageRecordRequest
from app.saas.services import TenantService
from app.security.dependencies import CurrentUserDependency


router = APIRouter(prefix="/api/tenants", tags=["tenants"])
plans = PlanRepository([
    Plan("starter", "Starter", 2900, 5, frozenset({"projects", "reports"})),
    Plan("scale", "Scale", 9900, 25, frozenset({"projects", "reports", "audit-log", "sso"})),
])
features = TenantFeatureService(plans)
service = TenantService(TenantRepository(), plans, UsageRepository(), features)


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    request: TenantCreateRequest, user: CurrentUserDependency
) -> TenantResponse:
    return to_tenant_response(service.create(request, user.id), features)


@router.get("", response_model=list[TenantResponse])
async def list_tenants(user: CurrentUserDependency) -> list[TenantResponse]:
    return [to_tenant_response(item, features) for item in service.list_all()]


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: str, user: CurrentUserDependency) -> TenantResponse:
    return to_tenant_response(service.get(tenant_id), features)


@router.post("/{tenant_id}/usage", status_code=status.HTTP_202_ACCEPTED)
async def record_usage(
    tenant_id: str, request: UsageRecordRequest, user: CurrentUserDependency
) -> dict[str, object]:
    record = service.record_usage(tenant_id, request)
    return {"tenant_id": record.tenant_id, "feature": record.feature, "quantity": record.quantity}
`
  }
];

const projects = [
  {
    slug: "python-employee-hr-system",
    name: "Employee HR Management System (Python)",
    description: "FastAPI HR platform with employees, departments, compensation, leave management, analytics, validation, and JWT authentication.",
    difficulty: "intermediate",
    order: 101,
    domainRouter: "app.hr.router",
    domainFiles: hrFiles,
    test: `from datetime import date\nfrom decimal import Decimal\n\nfrom app.hr.compensation import PercentageIncreasePolicy\nfrom app.hr.models import Address, Compensation, Employee, EmployeeStatus, EmploymentType\n\n\ndef test_percentage_increase_policy() -> None:\n    employee = Employee(\n        "1", "EMP-1", "Ada", "Lovelace", "ada@example.com", "engineering",\n        EmploymentType.FULL_TIME, EmployeeStatus.ACTIVE, date(2025, 1, 1),\n        Address("1 Main St", "Berlin", "DE", "10115"),\n        Compensation(Decimal("100000"), "EUR", date(2025, 1, 1)),\n    )\n    assert PercentageIncreasePolicy().adjusted_salary(employee, Decimal("5")) == Decimal("105000.00")\n`
  },
  {
    slug: "python-logistics-system",
    name: "Logistics and Shipment Management System (Python)",
    description: "FastAPI logistics platform with shipments, warehouses, tracking events, pricing strategies, analytics, and JWT authentication.",
    difficulty: "intermediate",
    order: 102,
    domainRouter: "app.logistics.router",
    domainFiles: logisticsFiles,
    test: `from decimal import Decimal\n\nfrom app.logistics.models import DeliveryPriority\nfrom app.logistics.strategies import WeightDistanceShippingCost\n\n\ndef test_shipping_cost_strategy() -> None:\n    cost = WeightDistanceShippingCost().calculate(\n        Decimal("10"), Decimal("100"), DeliveryPriority.EXPRESS\n    )\n    assert cost == Decimal("27.23")\n`
  },
  {
    slug: "python-energy-billing-system",
    name: "Energy Consumption and Billing System (Python)",
    description: "FastAPI energy platform with meters, readings, tariffs, invoices, consumption analytics, and JWT authentication.",
    difficulty: "advanced",
    order: 103,
    domainRouter: "app.energy.router",
    domainFiles: energyFiles,
    test: `from decimal import Decimal\n\nfrom app.energy.models import Tariff\nfrom app.energy.strategies import StandardTariffCalculation\n\n\ndef test_tariff_calculation() -> None:\n    tariff = Tariff("standard", "Standard", Decimal("0.30"), Decimal("10"), Decimal("0.20"))\n    charge = StandardTariffCalculation().calculate(Decimal("100"), tariff)\n    assert charge.subtotal == Decimal("40.00")\n    assert charge.tax == Decimal("8.00")\n    assert charge.total == Decimal("48.00")\n`
  },
  {
    slug: "python-b2b-saas-platform",
    name: "Multi-Tenant B2B SaaS Platform (Python)",
    description: "FastAPI multi-tenant SaaS with plans, subscriptions, feature entitlements, tenant context, usage aggregation, and JWT authentication.",
    difficulty: "advanced",
    order: 104,
    domainRouter: "app.saas.router",
    domainFiles: saasFiles,
    test: `from app.saas.features import TenantFeatureService\nfrom app.saas.models import Plan, Tenant, TenantStatus\nfrom app.saas.repositories import PlanRepository\n\n\ndef test_plan_features_are_enabled_for_active_tenant() -> None:\n    plans = PlanRepository([Plan("scale", "Scale", 9900, 25, frozenset({"sso", "audit-log"}))])\n    service = TenantFeatureService(plans)\n    tenant = Tenant("t-1", "acme", "Acme", TenantStatus.ACTIVE, "scale", "user-1")\n    assert service.enabled_features(tenant) == frozenset({"sso", "audit-log"})\n`
  }
];

for (const project of projects) {
  const files = [...commonFiles(project.name, project.domainRouter), ...project.domainFiles];
  const dir = join(root, project.slug);
  const manifest = {
    id: project.slug,
    name: project.name,
    language: "python",
    version: "1.0.0",
    description: project.description,
    difficulty: project.difficulty,
    order: project.order,
    files: files.map((file, index) => ({
      path: file.path,
      difficulty: file.difficulty,
      order: index + 1,
      estimatedMinutes: Math.max(4, Math.ceil(file.code.split("\n").length / 6)),
      topics: file.topics
    }))
  };

  write(dir, "manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
  write(dir, "project/pyproject.toml", `[project]\nname = "${project.slug}"\nversion = "1.0.0"\nrequires-python = ">=3.12"\ndependencies = [\n  "fastapi>=0.116,<1",\n  "pydantic-settings>=2.10,<3",\n  "PyJWT>=2.10,<3",\n  "uvicorn[standard]>=0.35,<1",\n  "email-validator>=2.2,<3",\n]\n\n[project.optional-dependencies]\ntest = ["pytest>=8.4,<9", "httpx>=0.28,<1"]\n\n[tool.pytest.ini_options]\npythonpath = ["."]\ntestpaths = ["tests"]\n`);
  write(dir, "project/requirements.txt", "fastapi>=0.116,<1\npydantic-settings>=2.10,<3\nPyJWT>=2.10,<3\nuvicorn[standard]>=0.35,<1\nemail-validator>=2.2,<3\n");
  write(dir, "project/README.md", `# ${project.name}\n\nInstall with \`python -m pip install -e .[test]\`, run with \`uvicorn app.main:app --reload\`, and test with \`pytest\`.\n`);
  write(dir, "project/app/__init__.py", "");
  write(dir, `project/${project.domainRouter.replaceAll(".", "/").replace("/router", "")}/__init__.py`, "");
  write(dir, "project/app/security/__init__.py", "");
  for (const file of files) write(dir, join("project", file.path), file.code);
  write(dir, "project/tests/test_domain.py", project.test);
  console.log(`${project.slug}: ${files.length} practice files`);
}
