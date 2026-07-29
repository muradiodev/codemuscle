package com.codemuscle.saas.model;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.Objects;

@Getter
@Builder(toBuilder = true)
public class Tenant {
    private final String id;
    private final String slug;
    private final String displayName;
    private final TenantStatus status;
    private final String planCode;
    private final Instant createdAt;

    public Tenant withStatus(TenantStatus next) {
        return toBuilder().status(next).build();
    }
}
