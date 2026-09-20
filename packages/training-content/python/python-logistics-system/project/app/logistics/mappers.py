from app.logistics.models import Shipment
from app.logistics.schemas import ShipmentResponse


def to_shipment_response(shipment: Shipment) -> ShipmentResponse:
    latest = shipment.events[-1].occurred_at if shipment.events else None
    return ShipmentResponse(
        id=shipment.id,
        tracking_number=shipment.tracking_number,
        origin_warehouse_id=shipment.origin_warehouse_id,
        destination=shipment.destination,
        priority=shipment.priority,
        total_weight_kg=shipment.total_weight_kg,
        shipping_cost=shipment.shipping_cost,
        status=shipment.status,
        event_count=len(shipment.events),
        last_updated_at=latest,
    )
