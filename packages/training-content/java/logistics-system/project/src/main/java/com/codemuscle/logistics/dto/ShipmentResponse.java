package com.codemuscle.logistics.dto;

import com.codemuscle.logistics.model.DeliveryPriority;
import com.codemuscle.logistics.model.ShipmentStatus;
import com.codemuscle.logistics.model.TrackingEvent;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ShipmentResponse(
        String id,
        String trackingNumber,
        ShipmentStatus status,
        DeliveryPriority priority,
        BigDecimal estimatedCost,
        Instant createdAt,
        List<TrackingEvent> events
) {}
