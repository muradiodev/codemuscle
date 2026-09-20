from fastapi import APIRouter, status

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
