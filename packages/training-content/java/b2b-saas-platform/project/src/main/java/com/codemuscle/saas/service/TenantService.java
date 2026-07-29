package com.codemuscle.saas.service;

import com.codemuscle.saas.dto.TenantCreateRequest;
import com.codemuscle.saas.dto.TenantResponse;
import com.codemuscle.saas.model.UsageRecord;
import com.codemuscle.saas.model.TenantStatus;
import java.util.List;
import java.util.Optional;

public interface TenantService {
    TenantResponse create(TenantCreateRequest request);
    TenantResponse find(String id);
    List<TenantResponse> findAll();
    TenantResponse replace(String id, TenantCreateRequest request);
    TenantResponse changeStatus(String id, TenantStatus status);
    void delete(String id);
    Optional<TenantResponse> findActiveSubscription(String tenantId);
    void assertUsageAllowed(String tenantId, UsageRecord usage);
}
