package com.codemuscle.hr.security;

import java.time.Instant;
import java.util.Set;

public record PlatformUser(
        String id,
        String username,
        String passwordHash,
        String email,
        String displayName,
        String jobTitle,
        String locale,
        Set<String> roles,
        boolean enabled,
        Instant createdAt
) {
    public PlatformUser {
        roles = Set.copyOf(roles);
    }
}
