package com.codemuscle.energy.config;

import com.codemuscle.energy.model.Tariff;
import com.codemuscle.energy.repository.TariffRepository;
import com.codemuscle.energy.strategy.TariffCalculationStrategy;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;

@Configuration
public class EnergyConfiguration {
    @Bean
    TariffCalculationStrategy tariffCalculationStrategy() {
        return TariffCalculationStrategy.standard();
    }

    @Bean
    ApplicationRunner seedTariffs(TariffRepository tariffRepository) {
        return args -> tariffRepository.put(new Tariff("RES-FLAT", new BigDecimal("0.24"), new BigDecimal("0.35")));
    }
}
