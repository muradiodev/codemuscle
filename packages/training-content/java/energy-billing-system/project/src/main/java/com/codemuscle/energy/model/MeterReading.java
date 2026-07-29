package com.codemuscle.energy.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

public record MeterReading(String meterId, Instant recordedAt, BigDecimal kilowattHours) {
    public MeterReading {
        Objects.requireNonNull(meterId, "meterId");
        Objects.requireNonNull(recordedAt, "recordedAt");
        Objects.requireNonNull(kilowattHours, "kilowattHours");
        if (kilowattHours.signum() < 0) {
            throw new IllegalArgumentException("Reading cannot be negative");
        }
    }

    public String dedupeKey() {
        return meterId + "|" + recordedAt.toEpochMilli();
    }
}
