package com.codemuscle.saas.dto;

import com.codemuscle.saas.model.TenantStatus;
import java.time.Instant;
import java.util.Set;

public record TenantResponse(
        String id,
        String slug,
        String displayName,
        TenantStatus status,
        String planCode,
        Set<String> features,
        Instant createdAt
) {}
