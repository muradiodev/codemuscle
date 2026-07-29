package com.codemuscle.energy.model;

import lombok.Builder;
import lombok.Getter;
import java.util.Objects;

@Getter
@Builder
public class Meter {
    private final String id;
    private final String serialNumber;
    private final String customerId;
    private final boolean active;
}
