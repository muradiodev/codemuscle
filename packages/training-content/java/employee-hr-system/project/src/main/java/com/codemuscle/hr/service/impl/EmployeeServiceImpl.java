package com.codemuscle.hr.service.impl;

import com.codemuscle.hr.dto.EmployeeCreateRequest;
import com.codemuscle.hr.dto.EmployeeResponse;
import com.codemuscle.hr.exception.EmployeeNotFoundException;
import com.codemuscle.hr.mapper.EmployeeMapper;
import com.codemuscle.hr.model.Address;
import com.codemuscle.hr.model.Employee;
import com.codemuscle.hr.model.EmployeeStatus;
import com.codemuscle.hr.model.LeaveRequest;
import com.codemuscle.hr.repository.DepartmentRepository;
import com.codemuscle.hr.repository.EmployeeRepository;
import com.codemuscle.hr.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {
    private static final BigDecimal MIN_SALARY = new BigDecimal("20000.00");

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeMapper mapper;

    @Override
    public EmployeeResponse create(EmployeeCreateRequest request) {
        if (request.annualSalary().compareTo(MIN_SALARY) < 0) {
            throw new IllegalArgumentException("Salary below company minimum");
        }
        employeeRepository.findByEmail(request.email()).ifPresent(existing -> {
            throw new IllegalStateException("Email already registered: " + existing.getEmail());
        });
        var department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown department"));
        var address = new Address("Pending", "Pending", "US", "00000");
        Employee saved = employeeRepository.save(mapper.toModel(request, department, address));
        log.info("Created employee {}", saved.getId());
        return mapper.toResponse(saved);
    }

    @Override
    public EmployeeResponse find(String id) {
        return employeeRepository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
    }

    @Override
    public List<EmployeeResponse> search(String query) {
        String term = query == null ? "" : query.toLowerCase(Locale.ROOT);
        return employeeRepository.findAll().stream()
                .filter(employee -> employee.fullName().toLowerCase(Locale.ROOT).contains(term)
                        || employee.getEmail().toLowerCase(Locale.ROOT).contains(term))
                .sorted(Comparator.comparing(Employee::getJoinedOn).reversed())
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public EmployeeResponse replace(String id, EmployeeCreateRequest request) {
        Employee current = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
        var department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown department"));
        Employee replacement = mapper.toModel(request, department, current.getAddress())
                .toBuilder().id(id).joinedOn(current.getJoinedOn()).build();
        return mapper.toResponse(employeeRepository.save(replacement));
    }

    @Override
    public EmployeeResponse changeStatus(String id, EmployeeStatus status) {
        Employee current = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
        return mapper.toResponse(employeeRepository.save(current.withStatus(status)));
    }

    @Override
    public void delete(String id) {
        employeeRepository.findById(id).orElseThrow(() -> new EmployeeNotFoundException(id));
        employeeRepository.deleteById(id);
    }

    @Override
    public Map<String, Long> countByDepartment() {
        return employeeRepository.findAll().stream()
                .filter(employee -> employee.getStatus() == EmployeeStatus.ACTIVE)
                .collect(Collectors.groupingBy(employee -> employee.getDepartment().code(), Collectors.counting()));
    }

    @Override
    public LeaveRequest requestLeave(LeaveRequest request) {
        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new EmployeeNotFoundException(request.employeeId()));
        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new IllegalStateException("Only active employees can request leave");
        }
        employeeRepository.save(employee.withStatus(EmployeeStatus.ON_LEAVE));
        return request;
    }
}
