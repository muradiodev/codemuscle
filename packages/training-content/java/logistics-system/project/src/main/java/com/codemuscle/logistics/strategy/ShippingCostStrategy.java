package com.codemuscle.logistics.strategy;

import com.codemuscle.logistics.model.DeliveryPriority;
import com.codemuscle.logistics.model.PackageItem;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@FunctionalInterface
public interface ShippingCostStrategy {
    BigDecimal calculate(List<PackageItem> items, DeliveryPriority priority);

    static ShippingCostStrategy weightBased() {
        return (items, priority) -> {
            BigDecimal weight = items.stream()
                    .map(PackageItem::totalWeight)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal base = weight.multiply(new BigDecimal("1.75"));
            BigDecimal multiplier = switch (priority) {
                case STANDARD -> BigDecimal.ONE;
                case EXPRESS -> new BigDecimal("1.35");
                case SAME_DAY -> new BigDecimal("1.85");
            };
            return base.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        };
    }
}
