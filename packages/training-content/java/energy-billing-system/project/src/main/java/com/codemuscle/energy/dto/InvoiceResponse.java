package com.codemuscle.energy.dto;

import com.codemuscle.energy.model.BillingStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceResponse(
        String id,
        String customerId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal consumptionKwh,
        BigDecimal amountDue,
        BillingStatus status
) {}
