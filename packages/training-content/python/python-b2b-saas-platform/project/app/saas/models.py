from dataclasses import dataclass, field
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
