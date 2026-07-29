package com.codemuscle.logistics.model;

import java.time.Instant;
import java.util.Objects;

public record TrackingEvent(Instant occurredAt, ShipmentStatus status, String locationCode, String note) {
    public TrackingEvent {
        Objects.requireNonNull(occurredAt, "occurredAt");
        Objects.requireNonNull(status, "status");
        Objects.requireNonNull(locationCode, "locationCode");
    }
}
