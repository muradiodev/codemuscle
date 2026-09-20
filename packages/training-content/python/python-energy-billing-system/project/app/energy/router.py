from decimal import Decimal

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
