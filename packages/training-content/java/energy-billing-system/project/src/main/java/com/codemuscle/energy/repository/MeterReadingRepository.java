package com.codemuscle.energy.repository;

import com.codemuscle.energy.model.MeterReading;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class MeterReadingRepository {
    private final Map<String, List<MeterReading>> byMeter = new ConcurrentHashMap<>();
    private final Set<String> seenKeys = ConcurrentHashMap.newKeySet();

    public MeterReading save(MeterReading reading) {
        if (!seenKeys.add(reading.dedupeKey())) {
            throw new IllegalStateException("Duplicate meter reading");
        }
        byMeter.computeIfAbsent(reading.meterId(), key -> new ArrayList<>()).add(reading);
        return reading;
    }

    public List<MeterReading> findByMeter(String meterId) {
        return List.copyOf(byMeter.getOrDefault(meterId, List.of()));
    }

    public Set<String> duplicateCandidates() {
        return new HashSet<>(seenKeys);
    }

    public void deleteByMeter(String meterId) {
        List<MeterReading> removed = byMeter.remove(meterId);
        if (removed != null) {
            removed.forEach(reading -> seenKeys.remove(reading.dedupeKey()));
        }
    }
}
