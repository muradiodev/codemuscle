from fastapi import APIRouter, status

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
