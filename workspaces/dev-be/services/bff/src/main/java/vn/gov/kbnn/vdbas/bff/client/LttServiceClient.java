package vn.gov.kbnn.vdbas.bff.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import vn.gov.kbnn.vdbas.bff.dto.*;

import java.util.ArrayList;
import java.util.Map;

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

        Map<String, Object> raw = lttWebClient.post()
                .uri(API_PATH + "/payment-orders")
                .header("Idempotency-Key", idempotencyKey.toString())
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return mapToPaymentOrderResponse(raw);
    }

    public PaymentOrderResponse getPaymentOrder(Long id, String userId, String userRole) {
        Map<String, Object> raw = lttWebClient.get()
                .uri(API_PATH + "/payment-orders/{id}", id)
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return mapToPaymentOrderResponse(raw);
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
        Map<String, Object> raw = lttWebClient.post()
                .uri(API_PATH + path, id)
                .header("Idempotency-Key", idempotencyKey.toString())
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return mapToPaymentOrderResponse(raw);
    }

    private PaymentOrderResponse postActionWithBody(String path, Long id, UUID idempotencyKey,
                                                     String userId, String userRole, Object body) {
        Map<String, Object> raw = lttWebClient.post()
                .uri(API_PATH + path, id)
                .header("Idempotency-Key", idempotencyKey.toString())
                .header("X-User-Id", userId)
                .header("X-User-Role", userRole)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return mapToPaymentOrderResponse(raw);
    }

    @SuppressWarnings("unchecked")
    private PaymentOrderResponse mapToPaymentOrderResponse(Map<String, Object> raw) {
        if (raw == null) return null;
        PaymentOrderResponse r = new PaymentOrderResponse();
        r.setId(toLong(raw.get("id")));
        r.setVersion(toLong(raw.get("version")));
        r.setStatus(str(raw.get("state")));
        r.setChannel(str(raw.get("channel")));
        r.setOrderType(str(raw.get("orderType")));
        r.setTransactionType(str(raw.get("txnType")));
        r.setSenderBankCode(str(raw.get("senderBankCode")));
        r.setSenderBankName(str(raw.get("senderBankName")));
        r.setReceiverBankCode(str(raw.get("receiverBankCode")));
        r.setReceiverBankName(str(raw.get("receiverBankName")));
        r.setPaymentContent(str(raw.get("paymentContent")));
        r.setCurrency(str(raw.get("currency")));
        r.setFeeType(str(raw.get("feeType")));
        r.setOriginalDocNo(str(raw.get("origDocNo")));
        r.setRejectReason(str(raw.get("rejectReason")));
        r.setMakerId(str(raw.get("makerId")));
        r.setMakerName(str(raw.get("makerName")));
        r.setCheckerId(str(raw.get("checkerId")));
        r.setCheckerName(str(raw.get("checkerName")));
        r.setApproverId(str(raw.get("approverId")));
        r.setApproverName(str(raw.get("approverName")));
        r.setGlVoucherNo(str(raw.get("glVoucherNo")));

        if (raw.get("paymentDate") != null) r.setPaymentDate(java.time.LocalDate.parse(str(raw.get("paymentDate"))));
        if (raw.get("amount") != null) r.setAmount(new java.math.BigDecimal(str(raw.get("amount"))));
        if (raw.get("exchangeRate") != null) r.setExchangeRate(new java.math.BigDecimal(str(raw.get("exchangeRate"))));
        if (raw.get("createdAt") != null) r.setCreatedAt(java.time.OffsetDateTime.parse(str(raw.get("createdAt"))));
        if (raw.get("updatedAt") != null) r.setUpdatedAt(java.time.OffsetDateTime.parse(str(raw.get("updatedAt"))));
        if (raw.get("checkedAt") != null) r.setCheckedAt(java.time.OffsetDateTime.parse(str(raw.get("checkedAt"))));
        if (raw.get("approvedAt") != null) r.setApprovedAt(java.time.OffsetDateTime.parse(str(raw.get("approvedAt"))));

        // Map sender info from flat fields
        SenderInfoDto sender = new SenderInfoDto();
        sender.setName(str(raw.get("senderName")));
        sender.setAddress(str(raw.get("senderAddress")));
        sender.setAccountNumber(str(raw.get("senderAccount")));
        sender.setCustomerCode(str(raw.get("senderCustomerCode")));
        sender.setBankCode(str(raw.get("senderBankCode")));
        sender.setBankName(str(raw.get("senderBankName")));
        sender.setIdentityDoc(str(raw.get("senderIdNumber")));
        sender.setTpcpCode(str(raw.get("tpcpCode")));
        if (raw.get("senderIdIssueDate") != null)
            sender.setIdentityDocIssueDate(java.time.LocalDate.parse(str(raw.get("senderIdIssueDate"))));
        r.setSenderInfo(sender);

        // Map receiver info from flat fields
        ReceiverInfoDto receiver = new ReceiverInfoDto();
        receiver.setName(str(raw.get("receiverName")));
        receiver.setAddress(str(raw.get("receiverAddress")));
        receiver.setAccountNumber(str(raw.get("receiverAccount")));
        receiver.setBankCode(str(raw.get("receiverBankCode")));
        receiver.setBankName(str(raw.get("receiverBankName")));
        receiver.setAccountName(str(raw.get("receiverAccountName")));
        receiver.setIdentityDoc(str(raw.get("receiverIdNumber")));
        if (raw.get("receiverIdIssueDate") != null)
            receiver.setIdentityDocIssueDate(java.time.LocalDate.parse(str(raw.get("receiverIdIssueDate"))));
        r.setReceiverInfo(receiver);

        // Map line items
        Object rawItems = raw.get("lineItems");
        if (rawItems instanceof java.util.List<?> list) {
            java.util.List<LineItemDto> items = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    LineItemDto li = new LineItemDto();
                    li.setFundCode(str(m.get("coaFund")));
                    li.setNaturalAccount(str(m.get("coaNaturalAccount")));
                    li.setDvqhns(str(m.get("coaDvqhns")));
                    li.setBudgetLevel(str(m.get("coaBudgetLevel")));
                    li.setChapter(str(m.get("coaChapter")));
                    li.setEconomicSector(str(m.get("coaIndustry")));
                    li.setNdkt(str(m.get("coaNdkt")));
                    li.setArea(str(m.get("coaArea")));
                    li.setProgram(str(m.get("coaProgram")));
                    li.setFundSource(str(m.get("coaFundSource")));
                    li.setTreasuryCode(str(m.get("coaTreasury")));
                    li.setReserve(str(m.get("coaReserve")));
                    li.setDescription(str(m.get("description")));
                    if (m.get("lineAmount") != null) li.setItemAmount(new java.math.BigDecimal(str(m.get("lineAmount"))));
                    items.add(li);
                }
            }
            r.setLineItems(items);
        }

        r.setAttachments(java.util.List.of());
        return r;
    }

    private static String str(Object val) {
        return val != null ? val.toString() : null;
    }

    private static Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number n) return n.longValue();
        return Long.parseLong(val.toString());
    }
}
