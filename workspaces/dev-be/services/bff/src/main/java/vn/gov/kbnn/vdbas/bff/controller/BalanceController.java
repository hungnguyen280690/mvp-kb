package vn.gov.kbnn.vdbas.bff.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.gov.kbnn.vdbas.bff.client.LttServiceClient;
import vn.gov.kbnn.vdbas.bff.dto.BalanceResponse;

/**
 * REST controller cho kiem tra so du tai khoan.
 * Mapping tu OpenAPI: GET /balance
 */
@Slf4j
@RestController
@RequestMapping("/api/internal/v1/balance")
@RequiredArgsConstructor
public class BalanceController {

    private final LttServiceClient lttClient;

    @GetMapping
    public ResponseEntity<BalanceResponse> getBalance(
            @RequestParam String accountNumber,
            @RequestParam(defaultValue = "VND") String currency,
            @RequestParam(required = false) String asOfDate,
            @RequestHeader("X-User-Id") String userId) {

        log.info("Get balance: accountNumber={}, currency={}", accountNumber, currency);
        BalanceResponse response = lttClient.getBalance(accountNumber, currency, asOfDate, userId);
        return ResponseEntity.ok(response);
    }
}
