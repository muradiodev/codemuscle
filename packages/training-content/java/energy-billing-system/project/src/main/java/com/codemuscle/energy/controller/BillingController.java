package com.codemuscle.energy.controller;

import com.codemuscle.energy.dto.InvoiceResponse;
import com.codemuscle.energy.dto.ReadingIngestRequest;
import com.codemuscle.energy.model.MeterReading;
import com.codemuscle.energy.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {
    private final BillingService billingService;

    @PostMapping("/readings")
    public ResponseEntity<MeterReading> ingest(@Valid @RequestBody ReadingIngestRequest request) {
        return ResponseEntity.accepted().body(billingService.ingest(request));
    }

    @PutMapping("/readings/{meterId}")
    public MeterReading replaceReading(@PathVariable String meterId,
                                       @Valid @RequestBody ReadingIngestRequest request) {
        return billingService.ingest(new ReadingIngestRequest(
                meterId, request.recordedAt(), request.kilowattHours()));
    }

    @PatchMapping("/readings/{meterId}")
    public MeterReading patchReading(@PathVariable String meterId,
                                     @Valid @RequestBody ReadingIngestRequest request) {
        return billingService.ingest(new ReadingIngestRequest(
                meterId, request.recordedAt(), request.kilowattHours()));
    }

    @DeleteMapping("/readings/{meterId}")
    public ResponseEntity<Void> deleteReadings(@PathVariable String meterId) {
        billingService.deleteReadings(meterId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invoices")
    public InvoiceResponse invoice(@RequestParam String customerId,
                                   @RequestParam String meterId,
                                   @RequestParam String tariffCode,
                                   @RequestParam LocalDate from,
                                   @RequestParam LocalDate to) {
        return billingService.generateInvoice(customerId, meterId, tariffCode, from, to);
    }

    @GetMapping("/meters/{meterId}/gaps")
    public List<MeterReading> gaps(@PathVariable String meterId,
                                   @RequestParam LocalDate from,
                                   @RequestParam LocalDate to) {
        return billingService.missingGaps(meterId, from, to);
    }
}
