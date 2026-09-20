from datetime import datetime

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
