package com.codemuscle.hr.repository;

import com.codemuscle.hr.model.Employee;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryEmployeeRepository implements EmployeeRepository {
    private final ConcurrentHashMap<String, Employee> byId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> emailIndex = new ConcurrentHashMap<>();

    @Override
    public Employee save(Employee employee) {
        byId.put(employee.getId(), employee);
        emailIndex.put(employee.getEmail().toLowerCase(Locale.ROOT), employee.getId());
        return employee;
    }

    @Override
    public Optional<Employee> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    @Override
    public Optional<Employee> findByEmail(String email) {
        String id = emailIndex.get(email.toLowerCase(Locale.ROOT));
        return id == null ? Optional.empty() : findById(id);
    }

    @Override
    public List<Employee> findAll() {
        return new ArrayList<>(byId.values());
    }

    @Override
    public void deleteById(String id) {
        Employee removed = byId.remove(id);
        if (removed != null) {
            emailIndex.remove(removed.getEmail().toLowerCase(Locale.ROOT));
        }
    }

    @Override
    public List<Employee> findByDepartmentId(String departmentId) {
        return byId.values().stream()
                .filter(employee -> employee.getDepartment().id().equals(departmentId))
                .toList();
    }
}
