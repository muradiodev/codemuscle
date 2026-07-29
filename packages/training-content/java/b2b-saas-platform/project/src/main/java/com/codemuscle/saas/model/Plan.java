package com.codemuscle.saas.model;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.Set;

public record Plan(String code, String name, BigDecimal monthlyPrice, int seatLimit, long apiCallLimit, Set<String> features) {
    public Plan {
        Objects.requireNonNull(code, "code");
        Objects.requireNonNull(monthlyPrice, "monthlyPrice");
        Objects.requireNonNull(features, "features");
        if (seatLimit <= 0 || apiCallLimit <= 0) {
            throw new IllegalArgumentException("Limits must be positive");
        }
    }
}
