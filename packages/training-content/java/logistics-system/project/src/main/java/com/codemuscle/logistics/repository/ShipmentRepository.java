package com.codemuscle.logistics.repository;

import com.codemuscle.logistics.model.Shipment;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class ShipmentRepository {
    private final ConcurrentHashMap<String, Shipment> byId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> trackingIndex = new ConcurrentHashMap<>();

    public Shipment save(Shipment shipment) {
        byId.put(shipment.getId(), shipment);
        trackingIndex.put(shipment.getTrackingNumber(), shipment.getId());
        return shipment;
    }

    public Optional<Shipment> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    public Optional<Shipment> findByTrackingNumber(String trackingNumber) {
        return Optional.ofNullable(trackingIndex.get(trackingNumber)).flatMap(this::findById);
    }

    public List<Shipment> findAll() {
        return new ArrayList<>(byId.values());
    }

    public Shipment compute(String id, java.util.function.UnaryOperator<Shipment> updater) {
        return byId.computeIfPresent(id, (key, current) -> updater.apply(current));
    }
}
