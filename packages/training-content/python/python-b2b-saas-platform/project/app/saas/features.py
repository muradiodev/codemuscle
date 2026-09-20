from app.saas.models import Tenant, TenantStatus
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
