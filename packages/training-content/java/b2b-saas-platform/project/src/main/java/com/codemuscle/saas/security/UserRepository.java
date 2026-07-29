package com.codemuscle.saas.security;

import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class UserRepository {
    private final ConcurrentHashMap<String, PlatformUser> usersByName = new ConcurrentHashMap<>();

    public PlatformUser save(PlatformUser user) {
        PlatformUser existing = usersByName.putIfAbsent(user.username().toLowerCase(), user);
        if (existing != null) {
            throw new IllegalStateException("Username is already registered");
        }
        return user;
    }

    public Optional<PlatformUser> findByUsername(String username) {
        return Optional.ofNullable(usersByName.get(username.toLowerCase()));
    }
}
