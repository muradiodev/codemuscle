package com.codemuscle.hr.mapper;

import com.codemuscle.hr.dto.EmployeeCreateRequest;
import com.codemuscle.hr.dto.EmployeeResponse;
import com.codemuscle.hr.model.Address;
import com.codemuscle.hr.model.Compensation;
import com.codemuscle.hr.model.Department;
import com.codemuscle.hr.model.Employee;
import com.codemuscle.hr.model.EmployeeStatus;
import org.mapstruct.Mapper;
import java.time.LocalDate;
import java.util.Currency;
import java.util.HashSet;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {
    default Employee toModel(EmployeeCreateRequest request, Department department, Address address) {
        return Employee.builder()
                .id(UUID.randomUUID().toString())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .department(department)
                .employmentType(request.employmentType())
                .status(EmployeeStatus.ACTIVE)
                .compensation(new Compensation(request.annualSalary(), Currency.getInstance(request.currencyCode())))
                .address(address)
                .joinedOn(LocalDate.now())
                .skills(request.skills() == null ? new HashSet<>() : new HashSet<>(request.skills()))
                .build();
    }

    default EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.fullName(),
                employee.getEmail(),
                employee.getDepartment().code(),
                employee.getEmploymentType(),
                employee.getStatus(),
                employee.getCompensation().annualSalary(),
                employee.getCompensation().currency().getCurrencyCode(),
                employee.getJoinedOn(),
                employee.getSkills()
        );
    }
}
