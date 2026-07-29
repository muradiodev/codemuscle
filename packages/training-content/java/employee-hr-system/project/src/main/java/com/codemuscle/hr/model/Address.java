package com.codemuscle.hr.model;

import java.util.Objects;

public record Address(String line1, String city, String countryCode, String postalCode) {
    public Address {
        Objects.requireNonNull(line1, "line1 is required");
        Objects.requireNonNull(city, "city is required");
        Objects.requireNonNull(countryCode, "countryCode is required");
        if (countryCode.length() != 2) {
            throw new IllegalArgumentException("countryCode must be ISO-3166 alpha-2");
        }
    }
}
