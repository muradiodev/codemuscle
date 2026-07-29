package com.codemuscle.energy.strategy;

import com.codemuscle.energy.model.Tariff;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.time.LocalDate;

@FunctionalInterface
public interface TariffCalculationStrategy {
    BigDecimal calculate(Tariff tariff, BigDecimal consumptionKwh, LocalDate from, LocalDate to);

    static TariffCalculationStrategy standard() {
        return (tariff, consumption, from, to) -> {
            long days = ChronoUnit.DAYS.between(from, to) + 1;
            BigDecimal energy = consumption.multiply(tariff.pricePerKwh());
            BigDecimal standing = tariff.standingChargeDaily().multiply(BigDecimal.valueOf(days));
            return energy.add(standing).setScale(2, RoundingMode.HALF_UP);
        };
    }
}
