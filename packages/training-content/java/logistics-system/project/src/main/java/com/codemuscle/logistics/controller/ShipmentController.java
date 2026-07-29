package com.codemuscle.logistics.controller;

import com.codemuscle.logistics.dto.ShipmentCreateRequest;
import com.codemuscle.logistics.dto.ShipmentResponse;
import com.codemuscle.logistics.model.ShipmentStatus;
import com.codemuscle.logistics.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {
    private final ShipmentService shipmentService;

    @PostMapping
    public ResponseEntity<ShipmentResponse> create(@Valid @RequestBody ShipmentCreateRequest request) {
        ShipmentResponse response = shipmentService.create(request);
        return ResponseEntity.created(URI.create("/api/shipments/" + response.id())).body(response);
    }

    @GetMapping("/track/{trackingNumber}")
    public ShipmentResponse track(@PathVariable String trackingNumber) {
        return shipmentService.track(trackingNumber);
    }

    @PostMapping("/{id}/advance")
    public ShipmentResponse advance(@PathVariable String id, @RequestBody Map<String, String> body) {
        return shipmentService.advance(
                id,
                ShipmentStatus.valueOf(body.get("status")),
                body.getOrDefault("location", "UNKNOWN"),
                body.getOrDefault("note", "")
        );
    }

    @PutMapping("/{id}/status")
    public ShipmentResponse replaceStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return shipmentService.advance(id, ShipmentStatus.valueOf(body.get("status")),
                body.getOrDefault("location", "UNKNOWN"), body.getOrDefault("note", "Status replaced"));
    }

    @PatchMapping("/{id}/status")
    public ShipmentResponse patchStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return shipmentService.advance(id, ShipmentStatus.valueOf(body.get("status")),
                body.getOrDefault("location", "UNKNOWN"), body.getOrDefault("note", "Status patched"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable String id) {
        shipmentService.advance(id, ShipmentStatus.CANCELLED, "SYSTEM", "Shipment cancelled");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/queue")
    public List<ShipmentResponse> queue() {
        return shipmentService.prioritizedQueue();
    }
}
