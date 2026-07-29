package com.codemuscle.saas.model;

import java.time.Instant;
import java.util.Objects;

public record Subscription(String tenantId, String planCode, Instant startsAt, Instant endsAt, boolean autoRenew) {
    public Subscription {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(planCode, "planCode");
        Objects.requireNonNull(startsAt, "startsAt");
        if (endsAt != null && endsAt.isBefore(startsAt)) {
            throw new IllegalArgumentException("endsAt before startsAt");
        }
    }

    public boolean isActiveAt(Instant instant) {
        return !instant.isBefore(startsAt) && (endsAt == null || instant.isBefore(endsAt));
    }
}
