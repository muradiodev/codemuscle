package com.codemuscle.saas.service.impl;

import com.codemuscle.saas.dto.TenantCreateRequest;
import com.codemuscle.saas.dto.TenantResponse;
import com.codemuscle.saas.model.Plan;
import com.codemuscle.saas.model.Subscription;
import com.codemuscle.saas.model.Tenant;
import com.codemuscle.saas.model.TenantStatus;
import com.codemuscle.saas.model.UsageRecord;
import com.codemuscle.saas.repository.TenantRepository;
import com.codemuscle.saas.service.TenantFeatureService;
import com.codemuscle.saas.service.TenantService;
import com.codemuscle.saas.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {
    private final TenantRepository tenantRepository;
    private final TenantFeatureService featureService;
    private final Map<String, Plan> plans;
    private final Map<String, Subscription> subscriptions = new ConcurrentHashMap<>();

    @Override
    public TenantResponse create(TenantCreateRequest request) {
        if (tenantRepository.findBySlug(request.slug()).isPresent()) {
            throw new IllegalStateException("Slug already taken");
        }
        Plan plan = Optional.ofNullable(plans.get(request.planCode()))
                .orElseThrow(() -> new IllegalArgumentException("Unknown plan"));
        Tenant tenant = Tenant.builder()
                .id(UUID.randomUUID().toString())
                .slug(request.slug())
                .displayName(request.displayName())
                .status(TenantStatus.TRIAL)
                .planCode(plan.code())
                .createdAt(Instant.now())
                .build();
        tenantRepository.save(tenant);
        subscriptions.put(tenant.getId(), new Subscription(tenant.getId(), plan.code(), Instant.now(), null, true));
        return toResponse(tenant);
    }

    @Override
    public TenantResponse find(String id) {
        return tenantRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
    }

    @Override
    public java.util.List<TenantResponse> findAll() {
        return tenantRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public TenantResponse replace(String id, TenantCreateRequest request) {
        Tenant current = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        Plan plan = Optional.ofNullable(plans.get(request.planCode()))
                .orElseThrow(() -> new IllegalArgumentException("Unknown plan"));
        Tenant replacement = current.toBuilder()
                .slug(request.slug())
                .displayName(request.displayName())
                .planCode(plan.code())
                .build();
        return toResponse(tenantRepository.save(replacement));
    }

    @Override
    public TenantResponse changeStatus(String id, TenantStatus status) {
        Tenant current = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        return toResponse(tenantRepository.save(current.withStatus(status)));
    }

    @Override
    public void delete(String id) {
        tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        tenantRepository.deleteById(id);
        subscriptions.remove(id);
    }

    @Override
    public Optional<TenantResponse> findActiveSubscription(String tenantId) {
        return Optional.ofNullable(subscriptions.get(tenantId))
                .filter(subscription -> subscription.isActiveAt(Instant.now()))
                .flatMap(subscription -> tenantRepository.findById(tenantId))
                .filter(tenant -> tenant.getStatus().allowsApiAccess())
                .map(this::toResponse);
    }

    @Override
    public void assertUsageAllowed(String tenantId, UsageRecord usage) {
        TenantContext.set(tenantId);
        try {
            Tenant tenant = tenantRepository.findById(tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
            if (!tenant.getStatus().allowsApiAccess()) {
                throw new IllegalStateException("Tenant suspended");
            }
            Plan plan = plans.get(tenant.getPlanCode());
            if (plan == null || !featureService.withinLimits(plan, usage)) {
                throw new IllegalStateException("Plan limits exceeded");
            }
        } finally {
            TenantContext.clear();
        }
    }

    private TenantResponse toResponse(Tenant tenant) {
        Plan plan = plans.get(tenant.getPlanCode());
        return new TenantResponse(
                tenant.getId(),
                tenant.getSlug(),
                tenant.getDisplayName(),
                tenant.getStatus(),
                tenant.getPlanCode(),
                plan == null ? java.util.Set.of() : plan.features(),
                tenant.getCreatedAt()
        );
    }
}
