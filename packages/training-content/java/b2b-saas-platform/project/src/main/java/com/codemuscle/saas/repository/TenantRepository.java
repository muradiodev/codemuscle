package com.codemuscle.saas.repository;

import com.codemuscle.saas.model.Tenant;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class TenantRepository {
    private final ConcurrentHashMap<String, Tenant> byId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> slugIndex = new ConcurrentHashMap<>();

    public Tenant save(Tenant tenant) {
        byId.put(tenant.getId(), tenant);
        slugIndex.put(tenant.getSlug(), tenant.getId());
        return tenant;
    }

    public Optional<Tenant> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    public Optional<Tenant> findBySlug(String slug) {
        return Optional.ofNullable(slugIndex.get(slug)).flatMap(this::findById);
    }

    public List<Tenant> findAll() {
        return new ArrayList<>(byId.values());
    }

    public void deleteById(String id) {
        Tenant removed = byId.remove(id);
        if (removed != null) {
            slugIndex.remove(removed.getSlug());
        }
    }
}
