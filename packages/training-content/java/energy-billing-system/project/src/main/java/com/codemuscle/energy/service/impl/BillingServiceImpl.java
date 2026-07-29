package com.codemuscle.energy.service.impl;

import com.codemuscle.energy.dto.InvoiceResponse;
import com.codemuscle.energy.dto.ReadingIngestRequest;
import com.codemuscle.energy.model.BillingStatus;
import com.codemuscle.energy.model.Invoice;
import com.codemuscle.energy.model.MeterReading;
import com.codemuscle.energy.repository.MeterReadingRepository;
import com.codemuscle.energy.repository.TariffRepository;
import com.codemuscle.energy.service.BillingService;
import com.codemuscle.energy.strategy.TariffCalculationStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {
    private final MeterReadingRepository readingRepository;
    private final TariffRepository tariffRepository;
    private final TariffCalculationStrategy calculationStrategy;

    @Override
    public MeterReading ingest(ReadingIngestRequest request) {
        return readingRepository.save(new MeterReading(request.meterId(), request.recordedAt(), request.kilowattHours()));
    }

    @Override
    public InvoiceResponse generateInvoice(String customerId, String meterId, String tariffCode, LocalDate from, LocalDate to) {
        var tariff = tariffRepository.find(tariffCode).orElseThrow(() -> new IllegalArgumentException("Unknown tariff"));
        List<MeterReading> readings = readingRepository.findByMeter(meterId).stream()
                .filter(reading -> {
                    LocalDate day = LocalDate.ofInstant(reading.recordedAt(), ZoneOffset.UTC);
                    return !day.isBefore(from) && !day.isAfter(to);
                })
                .sorted(Comparator.comparing(MeterReading::recordedAt))
                .toList();
        BigDecimal consumption = readings.stream()
                .map(MeterReading::kilowattHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal amount = calculationStrategy.calculate(tariff, consumption, from, to);
        Invoice invoice = Invoice.builder()
                .id(UUID.randomUUID().toString())
                .customerId(customerId)
                .periodStart(from)
                .periodEnd(to)
                .consumptionKwh(consumption)
                .amountDue(amount)
                .status(BillingStatus.ISSUED)
                .build();
        return new InvoiceResponse(invoice.getId(), invoice.getCustomerId(), invoice.getPeriodStart(),
                invoice.getPeriodEnd(), invoice.getConsumptionKwh(), invoice.getAmountDue(), invoice.getStatus());
    }

    @Override
    public List<MeterReading> missingGaps(String meterId, LocalDate from, LocalDate to) {
        var present = readingRepository.findByMeter(meterId).stream()
                .map(reading -> LocalDate.ofInstant(reading.recordedAt(), ZoneOffset.UTC))
                .collect(java.util.stream.Collectors.toSet());
        List<MeterReading> missing = new ArrayList<>();
        for (LocalDate cursor = from; !cursor.isAfter(to); cursor = cursor.plusDays(1)) {
            if (!present.contains(cursor)) {
                missing.add(new MeterReading(meterId, cursor.atStartOfDay().toInstant(ZoneOffset.UTC), BigDecimal.ZERO));
            }
        }
        return missing;
    }

    @Override
    public void deleteReadings(String meterId) {
        readingRepository.deleteByMeter(meterId);
    }
}
