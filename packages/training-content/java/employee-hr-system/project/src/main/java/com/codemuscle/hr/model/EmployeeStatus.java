package com.codemuscle.hr.model;

public enum EmployeeStatus {
    CANDIDATE,
    ACTIVE,
    ON_LEAVE,
    TERMINATED;

    public boolean canReceiveCompensationChanges() {
        return this == ACTIVE || this == ON_LEAVE;
    }
}
