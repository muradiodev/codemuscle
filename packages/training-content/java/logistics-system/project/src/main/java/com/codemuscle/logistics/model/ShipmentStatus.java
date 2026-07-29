package com.codemuscle.logistics.model;

public enum ShipmentStatus {
    CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED;

    public boolean canTransitionTo(ShipmentStatus next) {
        return switch (this) {
            case CREATED -> next == PICKED_UP || next == CANCELLED;
            case PICKED_UP -> next == IN_TRANSIT || next == CANCELLED;
            case IN_TRANSIT -> next == OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> next == DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
    }
}
