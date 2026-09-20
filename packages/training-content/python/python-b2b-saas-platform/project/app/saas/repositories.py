from app.exceptions import ConflictError
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
