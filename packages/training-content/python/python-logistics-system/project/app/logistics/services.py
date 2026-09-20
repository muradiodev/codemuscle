from uuid import uuid4

from app.exceptions import NotFoundError
from app.logistics.models import PackageItem, Shipment, ShipmentStatus, TrackingEvent
from app.logistics.repositories import ShipmentRepository, WarehouseRepository
from app.logistics.schemas import ShipmentCreateRequest, TrackingEventRequest
from app.logistics.strategies import ShippingCostStrategy


class ShipmentService:
    def __init__(
        self,
        shipments: ShipmentRepository,
        warehouses: WarehouseRepository,
        cost_strategy: ShippingCostStrategy,
    ) -> None:
        self._shipments = shipments
        self._warehouses = warehouses
        self._cost_strategy = cost_strategy

    def create(self, request: ShipmentCreateRequest) -> Shipment:
        if self._warehouses.find_by_id(request.origin_warehouse_id) is None:
            raise NotFoundError("Origin warehouse was not found")
        shipment_id = str(uuid4())
        items = tuple(PackageItem(**item.model_dump()) for item in request.items)
        weight = sum((item.total_weight_kg for item in items), start=0)
        shipment = Shipment(
            id=shipment_id,
            tracking_number=f"CM{shipment_id.replace('-', '')[:12].upper()}",
            origin_warehouse_id=request.origin_warehouse_id,
            destination=request.destination,
            priority=request.priority,
            items=items,
            shipping_cost=self._cost_strategy.calculate(weight, request.distance_km, request.priority),
        )
        return self._shipments.save(shipment)

    def get(self, shipment_id: str) -> Shipment:
        shipment = self._shipments.find_by_id(shipment_id)
        if shipment is None:
            raise NotFoundError("Shipment was not found")
        return shipment

    def list_all(self) -> list[Shipment]:
        return self._shipments.find_all()

    def track(self, shipment_id: str, request: TrackingEventRequest) -> Shipment:
        shipment = self.get(shipment_id)
        if shipment.status in {ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED}:
            raise ValueError("A final shipment cannot receive tracking events")
        return self._shipments.save(
            shipment.record(TrackingEvent(request.status, request.location))
        )
