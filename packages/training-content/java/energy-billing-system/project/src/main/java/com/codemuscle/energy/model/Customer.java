package com.codemuscle.energy.model;

import java.util.Objects;

public record Customer(String id, String accountNumber, String displayName, GridArea gridArea) {
    public Customer {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(accountNumber, "accountNumber");
        Objects.requireNonNull(gridArea, "gridArea");
    }
}
