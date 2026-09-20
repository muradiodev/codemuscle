from uuid import uuid4

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
