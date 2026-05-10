package vn.gov.kbnn.vdbas.bff.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import vn.gov.kbnn.vdbas.bff.dto.*;

import java.util.List;
import java.util.UUID;

/**
 * Client goi ltt-service (internal). Su dung WebClient.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LttServiceClient {

    private final WebClient lttWebClient;

    private static final String API_PATH = "/api/internal/v1";

    // =========================================================================
    // CRUD
    // =========================================================================

    public PaymentOrderListResponse listPaymentOrders(
            int page, int size, String sort, String channel, String orderType,
            String status, String unitCode, String paymentDateFrom, String paymentDateTo,
            String requestNumber, String senderBankCode, String receiverBankCode,
            Double amountFrom, Double amountTo, String userId, String userRole) {

        return lttWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(API_PATH + "/payment-orders")
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .queryParam("sort", sort)
                        .queryParamIfPresent("channel", java.util.Optional.ofNullable(channel))
                        .queryParamIfPresent("orderType", java.util.Optional.ofNullable(orderType))
                        .queryParamIfPresent("status", java.util.Optional.ofNullable(status))
                        .queryParamIfPresent("unitCode", java.util.Optional.ofNullable(unitCode))
                        .queryParamIfPresent("paymentDateFrom", java.util.Optional.ofNullable(paymentDateFrom))
                        .queryParamIfPresent("paymentDateTo", java.util.Optional.ofNullable(paymentDateTo))
                        .queryParamIfPresent("requestNumber", java.util.Optional.ofNullable(requestNumber))
                        .queryParamIfPresent("senderBankCode", java.util.Optional.ofNullable(senderBankCode))
                        .queryParamIfPresent("receiverBankCode", java.util.Optional.ofNullable(receiverBankCode))
                        .queryParamIfPresent("amountFrom", java.util.Optional.ofNullable(amountFrom))
                        .queryParamIfPresent("amountTo", java.util.Optional.ofNullable(amountTo))
                        .build())
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .retrieve()
                .bodyToMono(PaymentOrderListResponse.class)
                .block();
    }

    public PaymentOrderResponse createPaymentOrder(
            UUID idempotencyKey, String userId, String userRole,
            PaymentOrderCreateRequest request) {

        return lttWebClient.post()
                .uri(API_PATH + "/payment-orders")
                .header("Idempotency-Key", idempotencyKey.toString())
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PaymentOrderResponse.class)
                .block();
    }

    public PaymentOrderResponse getPaymentOrder(Long id, String userId, String userRole) {
        return lttWebClient.get()
                .uri(API_PATH + "/payment-orders/{id}", id)
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .retrieve()
                .bodyToMono(PaymentOrderResponse.class)
                .block();
    }

    public PaymentOrderResponse updatePaymentOrder(
            Long id, long version, String userId, String userRole,
            PaymentOrderUpdateRequest request) {

        return lttWebClient.put()
                .uri(API_PATH + "/payment-orders/{id}", id)
                .header("If-Match", "\"" + version + "\"")
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PaymentOrderResponse.class)
                .block();
    }

    public DeleteResponse deletePaymentOrder(
            Long id, long version, String userId, String userRole,
            DeleteRequest request) {

        return lttWebClient.method(org.springframework.http.HttpMethod.DELETE)
                .uri(API_PATH + "/payment-orders/{id}", id)
                .header("If-Match", "\"" + version + "\"")
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(DeleteResponse.class)
                .block();
    }

    // =========================================================================
    // Workflow
    // =========================================================================

    public PaymentOrderResponse submitPaymentOrder(
            Long id, UUID idempotencyKey, String userId, String userRole) {
        return postAction("/payment-orders/{id}/submit", id, idempotencyKey, userId, userRole);
    }

    public PaymentOrderResponse approvePaymentOrder(
            Long id, UUID idempotencyKey, String userId, String userRole) {
        return postAction("/payment-orders/{id}/approve", id, idempotencyKey, userId, userRole);
    }

    public PaymentOrderResponse rejectPaymentOrder(
            Long id, UUID idempotencyKey, String userId, String userRole,
            RejectRequest request) {
        return postActionWithBody("/payment-orders/{id}/reject", id, idempotencyKey, userId, userRole, request);
    }

    public PaymentOrderResponse signPaymentOrder(
            Long id, UUID idempotencyKey, String userId, String userRole,
            SignRequest request) {
        return postActionWithBody("/payment-orders/{id}/sign", id, idempotencyKey, userId, userRole, request);
    }

    public PaymentOrderResponse sendPaymentOrder(
            Long id, UUID idempotencyKey, String userId, String userRole) {
        return postAction("/payment-orders/{id}/send", id, idempotencyKey, userId, userRole);
    }

    public PaymentOrderResponse cancelPaymentOrder(
            Long id, UUID idempotencyKey, String userId, String userRole,
            CancelRequest request) {
        return postActionWithBody("/payment-orders/{id}/cancel", id, idempotencyKey, userId, userRole, request);
    }

    public PaymentOrderResponse reversePaymentOrder(
            Long id, UUID idempotencyKey, String userId, String userRole,
            ReverseRequest request) {
        return postActionWithBody("/payment-orders/{id}/reverse", id, idempotencyKey, userId, userRole, request);
    }

    // =========================================================================
    // Reference Data
    // =========================================================================

    public List<RefDataItem> getChannels(String userId) {
        return lttWebClient.get()
                .uri(API_PATH + "/dm/channels")
                .header("X-User-Id", userId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<RefDataItem>>() {})
                .block();
    }

    public Object getCoaSegments(String segmentType, String keyword, String userId) {
        return lttWebClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path(API_PATH + "/dm/coa-segments");
                    if (segmentType != null) builder.queryParam("segmentType", segmentType);
                    if (keyword != null) builder.queryParam("keyword", keyword);
                    return builder.build();
                })
                .header("X-User-Id", userId)
                .retrieve()
                .bodyToMono(Object.class)
                .block();
    }

    // =========================================================================
    // Balance
    // =========================================================================

    public BalanceResponse getBalance(String accountNumber, String currency, String asOfDate, String userId) {
        return lttWebClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path(API_PATH + "/balance")
                            .queryParam("accountNumber", accountNumber)
                            .queryParam("currency", currency);
                    if (asOfDate != null) builder.queryParam("asOfDate", asOfDate);
                    return builder.build();
                })
                .header("X-User-Id", userId)
                .retrieve()
                .bodyToMono(BalanceResponse.class)
                .block();
    }

    // =========================================================================
    // Callback
    // =========================================================================

    public PaymentCallbackResponse processCallback(UUID correlationId, PaymentCallbackRequest request) {
        return lttWebClient.post()
                .uri(API_PATH + "/callback/payment-status")
                .header("X-Correlation-Id", correlationId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PaymentCallbackResponse.class)
                .block();
    }

    // =========================================================================
    // Audit Trail
    // =========================================================================

    public AuditTrailResponse getAuditTrail(Long id, int page, int size, String userId, String userRole) {
        return lttWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(API_PATH + "/payment-orders/{id}/audit-trail")
                        .queryParam("page", page)
                        .queryParam("size", size)
                        .build(id))
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .retrieve()
                .bodyToMono(AuditTrailResponse.class)
                .block();
    }

    // =========================================================================
    // Helper methods
    // =========================================================================

    private PaymentOrderResponse postAction(String path, Long id, UUID idempotencyKey,
                                             String userId, String userRole) {
        return lttWebClient.post()
                .uri(API_PATH + path, id)
                .header("Idempotency-Key", idempotencyKey.toString())
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .retrieve()
                .bodyToMono(PaymentOrderResponse.class)
                .block();
    }

    private PaymentOrderResponse postActionWithBody(String path, Long id, UUID idempotencyKey,
                                                     String userId, String userRole, Object body) {
        return lttWebClient.post()
                .uri(API_PATH + path, id)
                .header("Idempotency-Key", idempotencyKey.toString())
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(PaymentOrderResponse.class)
                .block();
    }
}
