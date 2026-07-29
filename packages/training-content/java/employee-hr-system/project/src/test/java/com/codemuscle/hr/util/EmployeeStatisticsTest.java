package com.codemuscle.hr.util;

import com.codemuscle.hr.model.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Currency;
import java.util.List;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.assertEquals;

class EmployeeStatisticsTest {
    @Test
    void averagesActiveSalaries() {
        Department eng = new Department("1", "ENG", "Engineering");
        Employee a = Employee.builder().id("a").firstName("Ada").lastName("Lovelace").email("a@x.com")
                .department(eng).employmentType(EmploymentType.FULL_TIME).status(EmployeeStatus.ACTIVE)
                .compensation(new Compensation(new BigDecimal("120000.00"), Currency.getInstance("USD")))
                .address(new Address("1 Main", "London", "GB", "E1")).joinedOn(LocalDate.now()).skills(Set.of("java")).build();
        Employee b = Employee.builder().id("b").firstName("Grace").lastName("Hopper").email("g@x.com")
                .department(eng).employmentType(EmploymentType.FULL_TIME).status(EmployeeStatus.ACTIVE)
                .compensation(new Compensation(new BigDecimal("80000.00"), Currency.getInstance("USD")))
                .address(new Address("2 Main", "London", "GB", "E1")).joinedOn(LocalDate.now()).skills(Set.of("cobol")).build();
        assertEquals(new BigDecimal("100000.00"), EmployeeStatistics.averageSalary(List.of(a, b)));
    }
}
