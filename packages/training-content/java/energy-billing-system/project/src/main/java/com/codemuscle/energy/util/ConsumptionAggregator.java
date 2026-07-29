package com.codemuscle.energy.util;

import com.codemuscle.energy.model.MeterReading;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

public final class ConsumptionAggregator {
    private ConsumptionAggregator() {}

    public static Map<YearMonth, BigDecimal> byBillingMonth(Collection<MeterReading> readings) {
        return readings.stream().collect(Collectors.groupingBy(
                reading -> YearMonth.from(reading.recordedAt().atZone(ZoneOffset.UTC)),
                Collectors.mapping(MeterReading::kilowattHours,
                        Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
        ));
    }
}
