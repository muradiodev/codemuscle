package com.codemuscle.hr.dto;

import com.codemuscle.hr.model.EmploymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Set;

public record EmployeeCreateRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotBlank String departmentId,
        @NotNull EmploymentType employmentType,
        @NotNull @DecimalMin("0.00") BigDecimal annualSalary,
        @NotBlank String currencyCode,
        Set<String> skills
) {}
