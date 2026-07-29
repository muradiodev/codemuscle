package com.codemuscle.saas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TenantCreateRequest(
        @NotBlank @Pattern(regexp = "[a-z0-9-]{3,40}") String slug,
        @NotBlank String displayName,
        @NotBlank String planCode
) {}
