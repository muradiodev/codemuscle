package com.codemuscle.saas.model;

import java.time.YearMonth;
import java.util.Objects;

public record UsageRecord(String tenantId, YearMonth month, long apiCalls, int activeSeats) {
    public UsageRecord {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(month, "month");
        if (apiCalls < 0 || activeSeats < 0) {
            throw new IllegalArgumentException("Usage cannot be negative");
        }
    }
}
