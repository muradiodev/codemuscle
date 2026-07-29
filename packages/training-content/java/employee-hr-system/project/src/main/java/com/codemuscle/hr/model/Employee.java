package com.codemuscle.hr.model;

import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Getter
@Builder(toBuilder = true)
@EqualsAndHashCode(of = "id")
public class Employee {
    private final String id;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final Department department;
    private final EmploymentType employmentType;
    private final EmployeeStatus status;
    private final Compensation compensation;
    private final Address address;
    private final LocalDate joinedOn;
    @Builder.Default
    private final Set<String> skills = new HashSet<>();

    public Set<String> getSkills() {
        return Collections.unmodifiableSet(skills);
    }

    public Employee withStatus(EmployeeStatus next) {
        if (!status.canReceiveCompensationChanges() && next == EmployeeStatus.ACTIVE) {
            throw new IllegalStateException("Cannot reactivate employee from " + status);
        }
        return toBuilder().status(next).build();
    }

    public Employee assignDepartment(Department next) {
        return toBuilder().department(Objects.requireNonNull(next)).build();
    }

    public String fullName() {
        return firstName + " " + lastName;
    }
}
