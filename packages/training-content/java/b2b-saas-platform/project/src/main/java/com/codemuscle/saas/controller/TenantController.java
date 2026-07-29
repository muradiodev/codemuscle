package com.codemuscle.saas.controller;

import com.codemuscle.saas.dto.TenantCreateRequest;
import com.codemuscle.saas.dto.TenantResponse;
import com.codemuscle.saas.model.UsageRecord;
import com.codemuscle.saas.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {
    private final TenantService tenantService;

    @PostMapping
    public ResponseEntity<TenantResponse> create(@Valid @RequestBody TenantCreateRequest request) {
        TenantResponse response = tenantService.create(request);
        return ResponseEntity.created(URI.create("/api/tenants/" + response.id())).body(response);
    }

    @GetMapping("/{id}")
    public TenantResponse find(@PathVariable String id) {
        return tenantService.find(id);
    }

    @GetMapping
    public List<TenantResponse> findAll() {
        return tenantService.findAll();
    }

    @PutMapping("/{id}")
    public TenantResponse replace(@PathVariable String id,
                                  @Valid @RequestBody TenantCreateRequest request) {
        return tenantService.replace(id, request);
    }

    @PatchMapping("/{id}/status")
    public TenantResponse changeStatus(@PathVariable String id,
                                       @RequestParam com.codemuscle.saas.model.TenantStatus status) {
        return tenantService.changeStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        tenantService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/usage/assert")
    public ResponseEntity<Void> assertUsage(@PathVariable String id, @RequestBody UsageRecord usage) {
        tenantService.assertUsageAllowed(id, usage == null
                ? new UsageRecord(id, YearMonth.now(), 0, 0)
                : usage);
        return ResponseEntity.noContent().build();
    }
}
