package com.codemuscle.logistics.repository;

import com.codemuscle.logistics.model.Warehouse;
import org.springframework.stereotype.Repository;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class WarehouseRepository {
    private final Map<String, Warehouse> warehouses = new ConcurrentHashMap<>();
    private final Set<String> codes = ConcurrentHashMap.newKeySet();

    public Warehouse save(Warehouse warehouse) {
        if (!codes.add(warehouse.getCode()) && !warehouses.containsKey(warehouse.getId())) {
            throw new IllegalStateException("Duplicate warehouse code");
        }
        warehouses.put(warehouse.getId(), warehouse);
        return warehouse;
    }

    public Optional<Warehouse> findById(String id) {
        return Optional.ofNullable(warehouses.get(id));
    }

    public Set<String> knownCodes() {
        return new HashSet<>(codes);
    }
}
