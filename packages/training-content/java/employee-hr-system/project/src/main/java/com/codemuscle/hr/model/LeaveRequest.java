package com.codemuscle.hr.model;

import java.time.LocalDate;
import java.util.Objects;

public record LeaveRequest(String id, String employeeId, LocalDate from, LocalDate to, String reason) {
    public LeaveRequest {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(employeeId, "employeeId");
        Objects.requireNonNull(from, "from");
        Objects.requireNonNull(to, "to");
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("Leave end date cannot precede start date");
        }
    }

    public long days() {
        return java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
    }
}
