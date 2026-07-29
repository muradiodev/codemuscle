package com.codemuscle.energy.repository;

import com.codemuscle.energy.model.Tariff;
import org.springframework.stereotype.Repository;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Repository
public class TariffRepository {
    private final Map<String, Tariff> tariffs = new HashMap<>();

    public void put(Tariff tariff) {
        tariffs.put(tariff.code(), tariff);
    }

    public Optional<Tariff> find(String code) {
        return Optional.ofNullable(tariffs.get(code));
    }
}
