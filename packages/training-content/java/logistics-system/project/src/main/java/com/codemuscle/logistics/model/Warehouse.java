package com.codemuscle.logistics.model;

import lombok.Builder;
import lombok.Getter;
import java.util.Objects;

@Getter
@Builder
public class Warehouse {
    private final String id;
    private final String code;
    private final int capacityUnits;
    private int occupiedUnits;

    public synchronized boolean reserve(int units) {
        if (occupiedUnits + units > capacityUnits) {
            return false;
        }
        occupiedUnits += units;
        return true;
    }

    public int remainingCapacity() {
        return capacityUnits - occupiedUnits;
    }
}
