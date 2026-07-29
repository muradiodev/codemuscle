package com.codemuscle.saas.config;

import com.codemuscle.saas.model.Plan;
import com.codemuscle.saas.service.TenantFeatureService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;

@Configuration
public class SaasConfiguration {
    @Bean
    Map<String, Plan> plans() {
        return Map.of(
                "starter", new Plan("starter", "Starter", new BigDecimal("49.00"), 5, 50_000L, Set.of("basic-api")),
                "growth", new Plan("growth", "Growth", new BigDecimal("199.00"), 25, 500_000L, Set.of("basic-api", "webhooks", "sso"))
        );
    }

    @Bean
    TenantFeatureService tenantFeatureService(Map<String, Plan> plans) {
        return new TenantFeatureService(plans);
    }
}
