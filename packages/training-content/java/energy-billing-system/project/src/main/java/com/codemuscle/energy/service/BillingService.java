package com.codemuscle.energy.service;

import com.codemuscle.energy.dto.InvoiceResponse;
import com.codemuscle.energy.dto.ReadingIngestRequest;
import com.codemuscle.energy.model.MeterReading;
import java.time.LocalDate;
import java.util.List;

public interface BillingService {
    MeterReading ingest(ReadingIngestRequest request);
    InvoiceResponse generateInvoice(String customerId, String meterId, String tariffCode, LocalDate from, LocalDate to);
    List<MeterReading> missingGaps(String meterId, LocalDate from, LocalDate to);
    void deleteReadings(String meterId);
}
