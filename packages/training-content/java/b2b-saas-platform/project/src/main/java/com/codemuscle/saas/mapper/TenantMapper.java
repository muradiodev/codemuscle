package com.codemuscle.saas.mapper;

import com.codemuscle.saas.dto.TenantResponse;
import com.codemuscle.saas.model.Tenant;
import org.mapstruct.Mapper;
import java.util.Set;

@Mapper(componentModel = "spring")
public interface TenantMapper {
    TenantResponse toResponse(Tenant tenant, Set<String> features);
}
