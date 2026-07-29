package com.codemuscle.energy.model;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@Builder
public class Invoice {
    private final String id;
    private final String customerId;
    private final LocalDate periodStart;
    private final LocalDate periodEnd;
    private final BigDecimal consumptionKwh;
    private final BigDecimal amountDue;
    private final BillingStatus status;
}
