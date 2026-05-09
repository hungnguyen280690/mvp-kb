package vn.gov.kbnn.vdbas.bff.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.gov.kbnn.vdbas.bff.client.LttServiceClient;
import vn.gov.kbnn.vdbas.bff.dto.PaymentCallbackRequest;
import vn.gov.kbnn.vdbas.bff.dto.PaymentCallbackResponse;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * REST controller cho nhan callback tu NHNN/NHTM/LKB.
 * Mapping tu OpenAPI api-callback-v1.yaml: POST /api/callback/v1/payment-status
 */
@Slf4j
@RestController
@RequestMapping("/api/callback/v1")
@RequiredArgsConstructor
public class CallbackController {

    private final LttServiceClient lttClient;

    @PostMapping("/payment-status")
    public ResponseEntity<PaymentCallbackResponse> receivePaymentCallback(
            @RequestHeader("X-Correlation-Id") UUID correlationId,
            @RequestHeader(value = "X-VDBAS-Signature", required = false) String signature,
            @Valid @RequestBody PaymentCallbackRequest request) {

        log.info("Receive payment callback: correlationId={}, channel={}, status={}",
                correlationId, request.getChannel(), request.getStatus());

        // TODO: Verify HMAC signature (BIZ-SIGN-TAD-COMM)

        PaymentCallbackResponse response = lttClient.processCallback(correlationId, request);

        return switch (response.getResponseCode()) {
            case "00" -> ResponseEntity.ok(response);
            case "02" -> ResponseEntity.status(404).body(response);
            case "99" -> ResponseEntity.status(500).body(response);
            default -> ResponseEntity.badRequest().build();
        };
    }
}
