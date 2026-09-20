from app.saas.features import TenantFeatureService
from app.saas.models import Plan, Tenant, TenantStatus
from app.saas.repositories import PlanRepository


def test_plan_features_are_enabled_for_active_tenant() -> None:
    plans = PlanRepository([Plan("scale", "Scale", 9900, 25, frozenset({"sso", "audit-log"}))])
    service = TenantFeatureService(plans)
    tenant = Tenant("t-1", "acme", "Acme", TenantStatus.ACTIVE, "scale", "user-1")
    assert service.enabled_features(tenant) == frozenset({"sso", "audit-log"})
