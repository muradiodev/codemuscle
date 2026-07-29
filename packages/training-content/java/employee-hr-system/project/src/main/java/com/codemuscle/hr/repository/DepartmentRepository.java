package com.codemuscle.hr.repository;

import com.codemuscle.hr.model.Department;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class DepartmentRepository {
    private final Map<String, Department> departments = new ConcurrentHashMap<>();

    public Department save(Department department) {
        departments.put(department.id(), department);
        return department;
    }

    public Optional<Department> findById(String id) {
        return Optional.ofNullable(departments.get(id));
    }

    public Collection<Department> findAll() {
        return departments.values();
    }
}
