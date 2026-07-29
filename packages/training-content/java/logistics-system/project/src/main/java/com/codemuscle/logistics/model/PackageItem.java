package com.codemuscle.logistics.model;

import java.math.BigDecimal;
import java.util.Objects;

public record PackageItem(String sku, int quantity, BigDecimal weightKg) {
    public PackageItem {
        Objects.requireNonNull(sku, "sku");
        Objects.requireNonNull(weightKg, "weightKg");
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be positive");
        if (weightKg.signum() <= 0) throw new IllegalArgumentException("weight must be positive");
    }

    public BigDecimal totalWeight() {
        return weightKg.multiply(BigDecimal.valueOf(quantity));
    }
}
