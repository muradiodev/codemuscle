package com.codemuscle.logistics.service.impl;

import com.codemuscle.logistics.dto.ShipmentCreateRequest;
import com.codemuscle.logistics.dto.ShipmentResponse;
import com.codemuscle.logistics.model.Shipment;
import com.codemuscle.logistics.model.ShipmentStatus;
import com.codemuscle.logistics.model.TrackingEvent;
import com.codemuscle.logistics.repository.ShipmentRepository;
import com.codemuscle.logistics.repository.WarehouseRepository;
import com.codemuscle.logistics.service.ShipmentService;
import com.codemuscle.logistics.strategy.ShippingCostStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {
    private final ShipmentRepository shipmentRepository;
    private final WarehouseRepository warehouseRepository;
    private final ShippingCostStrategy costStrategy;

    @Override
    public ShipmentResponse create(ShipmentCreateRequest request) {
        var warehouse = warehouseRepository.findById(request.warehouseId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown warehouse"));
        int units = request.items().stream().mapToInt(item -> item.quantity()).sum();
        if (!warehouse.reserve(units)) {
            throw new IllegalStateException("Warehouse capacity exceeded");
        }
        String tracking = "TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Shipment shipment = Shipment.builder()
                .id(UUID.randomUUID().toString())
                .trackingNumber(tracking)
                .warehouseId(warehouse.getId())
                .priority(request.priority())
                .items(List.copyOf(request.items()))
                .status(ShipmentStatus.CREATED)
                .createdAt(Instant.now())
                .events(List.of(new TrackingEvent(Instant.now(), ShipmentStatus.CREATED, warehouse.getCode(), "Created")))
                .build();
        return toResponse(shipmentRepository.save(shipment));
    }

    @Override
    public ShipmentResponse track(String trackingNumber) {
        return shipmentRepository.findByTrackingNumber(trackingNumber)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Unknown tracking number"));
    }

    @Override
    public ShipmentResponse advance(String id, ShipmentStatus next, String location, String note) {
        Shipment updated = shipmentRepository.compute(id, current -> current.transition(next, location, note));
        if (updated == null) {
            throw new IllegalArgumentException("Shipment not found: " + id);
        }
        return toResponse(updated);
    }

    @Override
    public List<ShipmentResponse> prioritizedQueue() {
        return shipmentRepository.findAll().stream()
                .filter(shipment -> shipment.getStatus() != ShipmentStatus.DELIVERED
                        && shipment.getStatus() != ShipmentStatus.CANCELLED)
                .sorted(Comparator.comparingInt((Shipment s) -> s.getPriority().weight()).reversed()
                        .thenComparing(Shipment::getCreatedAt))
                .map(this::toResponse)
                .toList();
    }

    private ShipmentResponse toResponse(Shipment shipment) {
        return new ShipmentResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                shipment.getStatus(),
                shipment.getPriority(),
                costStrategy.calculate(shipment.getItems(), shipment.getPriority()),
                shipment.getCreatedAt(),
                shipment.getEvents()
        );
    }
}
