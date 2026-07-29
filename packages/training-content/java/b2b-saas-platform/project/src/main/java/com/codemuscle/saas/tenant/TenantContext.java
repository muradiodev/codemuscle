package com.codemuscle.saas.tenant;

import java.util.Objects;
import java.util.Optional;

public final class TenantContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(String tenantId) {
        CURRENT.set(Objects.requireNonNull(tenantId));
    }

    public static Optional<String> get() {
        return Optional.ofNullable(CURRENT.get());
    }

    public static String require() {
        return get().orElseThrow(() -> new IllegalStateException("Tenant context is missing"));
    }

    public static void clear() {
        CURRENT.remove();
    }
}
