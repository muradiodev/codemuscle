package com.codemuscle.hr.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Objects;

public record Compensation(BigDecimal annualSalary, Currency currency) {
    public Compensation {
        Objects.requireNonNull(annualSalary, "annualSalary is required");
        Objects.requireNonNull(currency, "currency is required");
        if (annualSalary.signum() < 0) {
            throw new IllegalArgumentException("annualSalary cannot be negative");
        }
        annualSalary = annualSalary.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal monthly() {
        return annualSalary.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
    }
}
