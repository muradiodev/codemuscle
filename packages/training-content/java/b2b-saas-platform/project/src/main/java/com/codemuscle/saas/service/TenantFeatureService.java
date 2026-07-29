package com.codemuscle.saas.service;

import com.codemuscle.saas.model.Permission;
import com.codemuscle.saas.model.Plan;
import com.codemuscle.saas.model.Role;
import com.codemuscle.saas.model.UsageRecord;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public class TenantFeatureService {
    private final Map<String, Plan> plans;
    private final Map<Role, Set<Permission>> rolePermissions;

    public TenantFeatureService(Map<String, Plan> plans) {
        this.plans = Map.copyOf(plans);
        this.rolePermissions = new EnumMap<>(Role.class);
        rolePermissions.put(Role.OWNER, EnumSet.allOf(Permission.class));
        rolePermissions.put(Role.ADMIN, EnumSet.of(Permission.USER_INVITE, Permission.FEATURE_TOGGLE, Permission.USAGE_READ, Permission.BILLING_VIEW));
        rolePermissions.put(Role.MEMBER, EnumSet.of(Permission.USAGE_READ));
        rolePermissions.put(Role.READ_ONLY, EnumSet.of(Permission.USAGE_READ, Permission.BILLING_VIEW));
    }

    public boolean hasFeature(String planCode, String feature) {
        Plan plan = plans.get(planCode);
        return plan != null && plan.features().contains(feature);
    }

    public boolean hasPermission(Role role, Permission permission) {
        return rolePermissions.getOrDefault(role, Set.of()).contains(permission);
    }

    public boolean withinLimits(Plan plan, UsageRecord usage) {
        return usage.activeSeats() <= plan.seatLimit() && usage.apiCalls() <= plan.apiCallLimit();
    }
}
