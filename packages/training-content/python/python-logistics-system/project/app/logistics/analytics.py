from collections import Counter
from decimal import Decimal

from app.logistics.models import Shipment, ShipmentStatus


def shipments_by_status(shipments: list[Shipment]) -> dict[ShipmentStatus, int]:
    counts = Counter(shipment.status for shipment in shipments)
    return {status: counts.get(status, 0) for status in ShipmentStatus}


def total_revenue(shipments: list[Shipment]) -> Decimal:
    return sum(
        (shipment.shipping_cost for shipment in shipments if shipment.status != ShipmentStatus.CANCELLED),
        start=Decimal("0"),
    )
