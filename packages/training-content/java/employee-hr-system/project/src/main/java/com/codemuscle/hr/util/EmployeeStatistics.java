package com.codemuscle.hr.util;

import com.codemuscle.hr.model.Employee;
import com.codemuscle.hr.model.EmployeeStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class EmployeeStatistics {
    private EmployeeStatistics() {}

    public static BigDecimal averageSalary(Collection<Employee> employees) {
        List<BigDecimal> salaries = employees.stream()
                .filter(employee -> employee.getStatus() == EmployeeStatus.ACTIVE)
                .map(employee -> employee.getCompensation().annualSalary())
                .toList();
        if (salaries.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal total = salaries.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(salaries.size()), 2, RoundingMode.HALF_UP);
    }

    public static Map<EmployeeStatus, Long> statusHistogram(Collection<Employee> employees) {
        return employees.stream().collect(Collectors.groupingBy(
                Employee::getStatus,
                () -> new EnumMap<>(EmployeeStatus.class),
                Collectors.counting()
        ));
    }

    public static List<Employee> topEarners(Collection<Employee> employees, int limit) {
        return employees.stream()
                .sorted(Comparator.comparing((Employee e) -> e.getCompensation().annualSalary()).reversed())
                .limit(limit)
                .toList();
    }
}
