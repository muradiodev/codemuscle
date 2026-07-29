package com.codemuscle.energy.strategy;

import com.codemuscle.energy.model.Tariff;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.assertEquals;

class TariffCalculationStrategyTest {
    @Test
    void calculatesEnergyPlusStandingCharge() {
        var tariff = new Tariff("T", new BigDecimal("0.20"), new BigDecimal("1.00"));
        var amount = TariffCalculationStrategy.standard()
                .calculate(tariff, new BigDecimal("10"), LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 2));
        assertEquals(new BigDecimal("4.00"), amount);
    }
}
