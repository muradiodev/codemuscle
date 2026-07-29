package com.codemuscle.hr.dto;

import com.codemuscle.hr.model.EmployeeStatus;
import com.codemuscle.hr.model.EmploymentType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public record EmployeeResponse(
        String id,
        String fullName,
        String email,
        String departmentCode,
        EmploymentType employmentType,
        EmployeeStatus status,
        BigDecimal annualSalary,
        String currency,
        LocalDate joinedOn,
        Set<String> skills
) {}
