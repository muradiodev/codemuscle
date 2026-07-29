package com.codemuscle.energy.mapper;

import com.codemuscle.energy.dto.InvoiceResponse;
import com.codemuscle.energy.model.Invoice;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BillingMapper {
    InvoiceResponse toResponse(Invoice invoice);
}
