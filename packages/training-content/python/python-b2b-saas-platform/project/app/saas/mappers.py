from app.saas.features import TenantFeatureService
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
