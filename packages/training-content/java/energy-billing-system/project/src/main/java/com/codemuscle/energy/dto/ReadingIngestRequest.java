package com.codemuscle.energy.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public record ReadingIngestRequest(
        @NotBlank String meterId,
        @NotNull Instant recordedAt,
        @NotNull @DecimalMin("0.000") BigDecimal kilowattHours
) {}
