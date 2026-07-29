package com.codemuscle.logistics.dto;

import com.codemuscle.logistics.model.DeliveryPriority;
import com.codemuscle.logistics.model.PackageItem;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ShipmentCreateRequest(
        @NotBlank String warehouseId,
        @NotNull DeliveryPriority priority,
        @NotEmpty @Valid List<PackageItem> items
) {}
