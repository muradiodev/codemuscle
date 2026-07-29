package com.codemuscle.saas.util;

import com.codemuscle.saas.model.UsageRecord;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

public final class UsageAggregator {
    private UsageAggregator() {}

    public static Map<String, Long> totalApiCallsByTenant(Collection<UsageRecord> records) {
        return records.stream().collect(Collectors.groupingBy(
                UsageRecord::tenantId,
                Collectors.summingLong(UsageRecord::apiCalls)
        ));
    }

    public static long totalSeats(Collection<UsageRecord> records) {
        return records.stream().mapToLong(UsageRecord::activeSeats).sum();
    }
}
