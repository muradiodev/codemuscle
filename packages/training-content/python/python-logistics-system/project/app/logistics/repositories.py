from typing import Protocol

from app.logistics.models import Shipment, Warehouse


class ShipmentRepository(Protocol):
    def save(self, shipment: Shipment) -> Shipment: ...
    def find_by_id(self, shipment_id: str) -> Shipment | None: ...
    def find_all(self) -> list[Shipment]: ...


class InMemoryShipmentRepository:
    def __init__(self) -> None:
        self._shipments: dict[str, Shipment] = {}

    def save(self, shipment: Shipment) -> Shipment:
        self._shipments[shipment.id] = shipment
        return shipment

    def find_by_id(self, shipment_id: str) -> Shipment | None:
        return self._shipments.get(shipment_id)

    def find_all(self) -> list[Shipment]:
        return list(self._shipments.values())


class WarehouseRepository:
    def __init__(self, warehouses: list[Warehouse] | None = None) -> None:
        self._warehouses = {warehouse.id: warehouse for warehouse in warehouses or []}

    def find_by_id(self, warehouse_id: str) -> Warehouse | None:
        return self._warehouses.get(warehouse_id)
