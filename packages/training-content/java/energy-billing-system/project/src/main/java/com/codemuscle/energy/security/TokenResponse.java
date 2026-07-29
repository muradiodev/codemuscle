package com.codemuscle.energy.security;

import java.time.Instant;
import java.util.Set;

public record TokenResponse(
        String accessToken,
        String tokenType,
        Instant expiresAt,
        String username,
        String displayName,
        Set<String> roles
) {}
