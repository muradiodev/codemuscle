package com.codemuscle.logistics.util;

import com.codemuscle.logistics.model.Shipment;
import com.codemuscle.logistics.model.ShipmentStatus;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class ShipmentAggregator {
    private ShipmentAggregator() {}

    public static Map<ShipmentStatus, List<Shipment>> groupByStatus(Collection<Shipment> shipments) {
        return shipments.stream().collect(Collectors.groupingBy(Shipment::getStatus));
    }

    public static Map<Boolean, List<Shipment>> partitionDelivered(Collection<Shipment> shipments) {
        return shipments.stream().collect(Collectors.partitioningBy(s -> s.getStatus() == ShipmentStatus.DELIVERED));
    }

    public static Map<String, Long> countByWarehouse(Collection<Shipment> shipments) {
        return shipments.stream().collect(Collectors.groupingBy(Shipment::getWarehouseId, Collectors.counting()));
    }
}
