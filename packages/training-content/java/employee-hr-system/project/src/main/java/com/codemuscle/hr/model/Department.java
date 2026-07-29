package com.codemuscle.hr.model;

import java.util.Objects;

public record Department(String id, String code, String name) {
    public Department {
        Objects.requireNonNull(id, "id is required");
        Objects.requireNonNull(code, "code is required");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
    }
}
