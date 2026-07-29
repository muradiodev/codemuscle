package com.codemuscle.energy.model;

import java.util.Objects;

public record GridArea(String code, String timeZone) {
    public GridArea {
        Objects.requireNonNull(code, "code");
        Objects.requireNonNull(timeZone, "timeZone");
    }
}
