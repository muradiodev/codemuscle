package com.codemuscle.logistics.strategy;

import com.codemuscle.logistics.model.DeliveryPriority;
import com.codemuscle.logistics.model.PackageItem;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShippingCostStrategyTest {
    @Test
    void expressCostsMoreThanStandard() {
        var items = List.of(new PackageItem("SKU-1", 2, new BigDecimal("1.5")));
        var strategy = ShippingCostStrategy.weightBased();
        assertTrue(strategy.calculate(items, DeliveryPriority.EXPRESS)
                .compareTo(strategy.calculate(items, DeliveryPriority.STANDARD)) > 0);
    }
}
