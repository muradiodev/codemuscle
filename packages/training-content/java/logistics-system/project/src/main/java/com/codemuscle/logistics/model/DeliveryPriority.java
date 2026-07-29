package com.codemuscle.logistics.model;

public enum DeliveryPriority {
    STANDARD(1), EXPRESS(2), SAME_DAY(3);

    private final int weight;

    DeliveryPriority(int weight) {
        this.weight = weight;
    }

    public int weight() {
        return weight;
    }
}
