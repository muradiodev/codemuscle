package com.codemuscle.saas.model;

public enum TenantStatus {
    TRIAL, ACTIVE, SUSPENDED, CANCELLED;

    public boolean allowsApiAccess() {
        return this == TRIAL || this == ACTIVE;
    }
}
