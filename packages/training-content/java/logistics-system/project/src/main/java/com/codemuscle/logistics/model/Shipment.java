package com.codemuscle.logistics.model;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Getter
@Builder(toBuilder = true)
public class Shipment {
    private final String id;
    private final String trackingNumber;
    private final String warehouseId;
    private final DeliveryPriority priority;
    private final List<PackageItem> items;
    @Builder.Default
    private final List<TrackingEvent> events = new ArrayList<>();
    private final ShipmentStatus status;
    private final Instant createdAt;

    public List<TrackingEvent> getEvents() {
        return Collections.unmodifiableList(events);
    }

    public int totalUnits() {
        return items.stream().mapToInt(PackageItem::quantity).sum();
    }

    public Shipment transition(ShipmentStatus next, String location, String note) {
        if (!status.canTransitionTo(next)) {
            throw new IllegalStateException("Illegal transition " + status + " -> " + next);
        }
        List<TrackingEvent> updated = new ArrayList<>(events);
        updated.add(new TrackingEvent(Instant.now(), next, location, note));
        return toBuilder().status(next).events(updated).build();
    }
}
