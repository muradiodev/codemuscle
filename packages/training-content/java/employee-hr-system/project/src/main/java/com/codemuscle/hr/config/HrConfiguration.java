package com.codemuscle.hr.config;

import com.codemuscle.hr.model.Department;
import com.codemuscle.hr.repository.DepartmentRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
public class HrConfiguration {
    @Bean
    ApplicationRunner seedDepartments(DepartmentRepository departmentRepository) {
        return args -> List.of(
                new Department("d-eng", "ENG", "Engineering"),
                new Department("d-hr", "HR", "Human Resources"),
                new Department("d-fin", "FIN", "Finance")
        ).forEach(departmentRepository::save);
    }
}
