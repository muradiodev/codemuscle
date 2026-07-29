package com.codemuscle.hr.repository;

import com.codemuscle.hr.model.Employee;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository {
    Employee save(Employee employee);
    Optional<Employee> findById(String id);
    Optional<Employee> findByEmail(String email);
    List<Employee> findAll();
    List<Employee> findByDepartmentId(String departmentId);
    void deleteById(String id);
}
