package com.codemuscle.saas.service;

import com.codemuscle.saas.model.Permission;
import com.codemuscle.saas.model.Plan;
import com.codemuscle.saas.model.Role;
import com.codemuscle.saas.model.UsageRecord;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Map;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

class TenantFeatureServiceTest {
    @Test
    void enforcesPlanLimitsAndPermissions() {
        Plan plan = new Plan("starter", "Starter", new BigDecimal("49.00"), 5, 100L, Set.of("basic-api"));
        var service = new TenantFeatureService(Map.of("starter", plan));
        assertTrue(service.hasFeature("starter", "basic-api"));
        assertTrue(service.hasPermission(Role.ADMIN, Permission.USER_INVITE));
        assertFalse(service.withinLimits(plan, new UsageRecord("t1", YearMonth.now(), 200, 1)));
    }
}
