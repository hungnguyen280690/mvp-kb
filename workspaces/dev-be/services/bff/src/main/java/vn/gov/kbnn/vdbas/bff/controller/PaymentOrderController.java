package vn.gov.kbnn.vdbas.bff.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.gov.kbnn.vdbas.bff.client.LttServiceClient;
import vn.gov.kbnn.vdbas.bff.dto.*;

import java.util.UUID;

/**
 * REST controller cho Payment Order CRUD + Workflow.
 * Mapping tu OpenAPI api-internal-v1.yaml.
 */
@Slf4j
@RestController
@RequestMapping("/api/internal/v1/payment-orders")
@RequiredArgsConstructor
public class PaymentOrderController {

    private final LttServiceClient lttClient;

    // =========================================================================
    // CRUD
    // =========================================================================

    @GetMapping
    public ResponseEntity<PaymentOrderListResponse> listPaymentOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "paymentDate,desc") String sort,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String unitCode,
            @RequestParam(required = false) String paymentDateFrom,
            @RequestParam(required = false) String paymentDateTo,
            @RequestParam(required = false) String requestNumber,
            @RequestParam(required = false) String senderBankCode,
            @RequestParam(required = false) String receiverBankCode,
            @RequestParam(required = false) Double amountFrom,
            @RequestParam(required = false) Double amountTo,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        log.info("List payment orders: page={}, size={}, channel={}, status={}", page, size, channel, status);
        PaymentOrderListResponse response = lttClient.listPaymentOrders(
                page, size, sort, channel, orderType, status, unitCode,
                paymentDateFrom, paymentDateTo, requestNumber,
                senderBankCode, receiverBankCode, amountFrom, amountTo,
                userId, userRole);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<PaymentOrderResponse> createPaymentOrder(
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody PaymentOrderCreateRequest request) {

        log.info("Create payment order: channel={}, receiverBankCode={}, userId={}",
                request.getChannel(), request.getReceiverBankCode(), userId);
        PaymentOrderResponse response = lttClient.createPaymentOrder(
                idempotencyKey, userId, userRole, request);

        HttpHeaders headers = new HttpHeaders();
        headers.setETag("\"" + response.getVersion() + "\"");
        return new ResponseEntity<>(response, headers, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentOrderResponse> getPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        log.info("Get payment order: id={}", id);
        PaymentOrderResponse response = lttClient.getPaymentOrder(id, userId, userRole);

        HttpHeaders headers = new HttpHeaders();
        headers.setETag("\"" + response.getVersion() + "\"");
        return ResponseEntity.ok().headers(headers).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentOrderResponse> updatePaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("If-Match") String ifMatch,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody PaymentOrderUpdateRequest request) {

        log.info("Update payment order: id={}, version={}", id, ifMatch);
        long version = Long.parseLong(ifMatch.replace("\"", ""));
        PaymentOrderResponse response = lttClient.updatePaymentOrder(
                id, version, userId, userRole, request);

        HttpHeaders headers = new HttpHeaders();
        headers.setETag("\"" + response.getVersion() + "\"");
        return ResponseEntity.ok().headers(headers).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<DeleteResponse> deletePaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("If-Match") String ifMatch,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody DeleteRequest request) {

        log.info("Delete payment order: id={}", id);
        long version = Long.parseLong(ifMatch.replace("\"", ""));
        DeleteResponse response = lttClient.deletePaymentOrder(
                id, version, userId, userRole, request);
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // Workflow Actions
    // =========================================================================

    @PostMapping("/{id}/submit")
    public ResponseEntity<PaymentOrderResponse> submitPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        log.info("Submit payment order: id={}", id);
        PaymentOrderResponse response = lttClient.submitPaymentOrder(
                id, idempotencyKey, userId, userRole);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<PaymentOrderResponse> approvePaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        log.info("Approve payment order: id={}, userId={}", id, userId);
        PaymentOrderResponse response = lttClient.approvePaymentOrder(
                id, idempotencyKey, userId, userRole);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<PaymentOrderResponse> rejectPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody RejectRequest request) {

        log.info("Reject payment order: id={}, userId={}", id, userId);
        PaymentOrderResponse response = lttClient.rejectPaymentOrder(
                id, idempotencyKey, userId, userRole, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<PaymentOrderResponse> signPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody SignRequest request) {

        log.info("Sign payment order: id={}", id);
        PaymentOrderResponse response = lttClient.signPaymentOrder(
                id, idempotencyKey, userId, userRole, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<PaymentOrderResponse> sendPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        log.info("Send payment order: id={}", id);
        PaymentOrderResponse response = lttClient.sendPaymentOrder(
                id, idempotencyKey, userId, userRole);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PaymentOrderResponse> cancelPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody CancelRequest request) {

        log.info("Cancel payment order: id={}", id);
        PaymentOrderResponse response = lttClient.cancelPaymentOrder(
                id, idempotencyKey, userId, userRole, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reverse")
    public ResponseEntity<PaymentOrderResponse> reversePaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody ReverseRequest request) {

        log.info("Reverse payment order: id={}", id);
        PaymentOrderResponse response = lttClient.reversePaymentOrder(
                id, idempotencyKey, userId, userRole, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // =========================================================================
    // Audit Trail
    // =========================================================================

    @GetMapping("/{id}/audit-trail")
    public ResponseEntity<AuditTrailResponse> getAuditTrail(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        log.info("Get audit trail: id={}", id);
        AuditTrailResponse response = lttClient.getAuditTrail(id, page, size, userId, userRole);
        return ResponseEntity.ok(response);
    }
}
