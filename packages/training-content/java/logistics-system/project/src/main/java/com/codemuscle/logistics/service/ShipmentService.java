package com.codemuscle.logistics.service;

import com.codemuscle.logistics.dto.ShipmentCreateRequest;
import com.codemuscle.logistics.dto.ShipmentResponse;
import com.codemuscle.logistics.model.ShipmentStatus;
import java.util.List;

public interface ShipmentService {
    ShipmentResponse create(ShipmentCreateRequest request);
    ShipmentResponse track(String trackingNumber);
    ShipmentResponse advance(String id, ShipmentStatus next, String location, String note);
    List<ShipmentResponse> prioritizedQueue();
}
