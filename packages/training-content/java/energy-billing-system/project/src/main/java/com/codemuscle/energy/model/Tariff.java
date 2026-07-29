package com.codemuscle.energy.model;

import java.math.BigDecimal;
import java.util.Objects;

public record Tariff(String code, BigDecimal pricePerKwh, BigDecimal standingChargeDaily) {
    public Tariff {
        Objects.requireNonNull(code, "code");
        Objects.requireNonNull(pricePerKwh, "pricePerKwh");
        Objects.requireNonNull(standingChargeDaily, "standingChargeDaily");
        if (pricePerKwh.signum() < 0 || standingChargeDaily.signum() < 0) {
            throw new IllegalArgumentException("Tariff amounts cannot be negative");
        }
    }
}
