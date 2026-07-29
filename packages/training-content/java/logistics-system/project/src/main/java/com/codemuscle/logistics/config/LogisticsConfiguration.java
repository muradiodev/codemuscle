package com.codemuscle.logistics.config;

import com.codemuscle.logistics.model.Warehouse;
import com.codemuscle.logistics.repository.WarehouseRepository;
import com.codemuscle.logistics.strategy.ShippingCostStrategy;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LogisticsConfiguration {
    @Bean
    ShippingCostStrategy shippingCostStrategy() {
        return ShippingCostStrategy.weightBased();
    }

    @Bean
    ApplicationRunner seedWarehouses(WarehouseRepository warehouseRepository) {
        return args -> warehouseRepository.save(Warehouse.builder()
                .id("wh-1").code("AMS-01").capacityUnits(10_000).occupiedUnits(0).build());
    }
}
