package com.codemuscle.logistics.mapper;

import com.codemuscle.logistics.dto.ShipmentResponse;
import com.codemuscle.logistics.model.Shipment;
import org.mapstruct.Mapper;
import java.math.BigDecimal;

@Mapper(componentModel = "spring")
public interface ShipmentMapper {
    ShipmentResponse toResponse(Shipment shipment, BigDecimal shippingCost);
}
