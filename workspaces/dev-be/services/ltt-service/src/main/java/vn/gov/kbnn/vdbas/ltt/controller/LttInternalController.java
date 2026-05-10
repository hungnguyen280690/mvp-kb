package vn.gov.kbnn.vdbas.ltt.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;
import vn.gov.kbnn.vdbas.ltt.domain.entity.LttAudit;
import vn.gov.kbnn.vdbas.ltt.domain.entity.LttLineItem;
import vn.gov.kbnn.vdbas.ltt.service.LttService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Internal API controller — duoc goi boi BFF.
 * Mapping tu OpenAPI api-internal-v1.yaml.
 */
@Slf4j
@RestController
@RequestMapping("/api/internal/v1")
@RequiredArgsConstructor
public class LttInternalController {

    private final LttService lttService;

    @GetMapping("/payment-orders")
    public ResponseEntity<Page<Ltt>> listPaymentOrders(
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
            @RequestParam(required = false) BigDecimal amountFrom,
            @RequestParam(required = false) BigDecimal amountTo,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        Page<Ltt> result = lttService.search(
                channel, orderType, status, unitCode,
                paymentDateFrom != null ? LocalDate.parse(paymentDateFrom) : null,
                paymentDateTo != null ? LocalDate.parse(paymentDateTo) : null,
                requestNumber, senderBankCode, receiverBankCode, amountFrom, amountTo,
                page, size);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payment-orders")
    public ResponseEntity<Ltt> createPaymentOrder(
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody CreateLttRequest request) {

        Ltt ltt = new Ltt();
        ltt.setChannel(request.channel());
        ltt.setOrderType(request.orderType());
        ltt.setTxnType(request.transactionType());
        ltt.setReceiverBankCode(request.receiverBankCode());
        ltt.setPaymentDate(request.paymentDate());
        ltt.setAmount(request.amount());
        ltt.setCurrency(request.currency());
        ltt.setOrigDocNo(request.originalDocNo());
        ltt.setOrigDocDate(request.originalDocDate());
        ltt.setFeeType(request.feeType());
        ltt.setPaymentContent(request.paymentContent());

        // Map SenderInfo
        if (request.senderInfo() != null) {
            ltt.setSenderName(request.senderInfo().name());
            ltt.setSenderAddress(request.senderInfo().address());
            ltt.setSenderAccount(request.senderInfo().accountNumber());
            ltt.setSenderCustomerCode(request.senderInfo().customerCode());
            ltt.setSenderBankCode(request.senderInfo().bankCode());
            ltt.setSenderBankName(request.senderInfo().bankName());
            ltt.setSenderIdNumber(request.senderInfo().identityDoc());
            ltt.setSenderIdIssueDate(request.senderInfo().identityDocIssueDate());
            ltt.setSenderIdIssuePlace(request.senderInfo().identityDocIssuePlace());
            ltt.setTpcpCode(request.senderInfo().tpcpCode());
        } else {
            ltt.setSenderName("N/A");
            ltt.setSenderBankCode("00000000");
        }

        // Map ReceiverInfo
        if (request.receiverInfo() != null) {
            ltt.setReceiverName(request.receiverInfo().name());
            ltt.setReceiverAddress(request.receiverInfo().address());
            ltt.setReceiverAccount(request.receiverInfo().accountNumber());
            ltt.setReceiverBankName(request.receiverInfo().bankName());
            ltt.setReceiverAccountName(request.receiverInfo().accountName());
            ltt.setReceiverIdNumber(request.receiverInfo().identityDoc());
            ltt.setReceiverIdIssueDate(request.receiverInfo().identityDocIssueDate());
            ltt.setReceiverIdIssuePlace(request.receiverInfo().identityDocIssuePlace());
        } else {
            ltt.setReceiverName("N/A");
        }

        // Map LineItems
        if (request.lineItems() != null) {
            List<LttLineItem> lineItems = new java.util.ArrayList<>();
            for (int i = 0; i < request.lineItems().size(); i++) {
                var dto = request.lineItems().get(i);
                LttLineItem item = new LttLineItem();
                item.setLtt(ltt);
                item.setLineNo(i + 1);
                item.setCoaFund(dto.fundCode());
                item.setCoaNaturalAccount(dto.naturalAccount());
                item.setCoaDvqhns(dto.dvqhns());
                item.setCoaBudgetLevel(dto.budgetLevel());
                item.setCoaChapter(dto.chapter());
                item.setCoaIndustry(dto.economicSector());
                item.setCoaNdkt(dto.ndkt());
                item.setCoaArea(dto.area());
                item.setCoaProgram(dto.program());
                item.setCoaFundSource(dto.fundSource());
                item.setCoaTreasury(dto.treasuryCode());
                item.setCoaReserve(dto.reserve());
                item.setDescription(dto.description() != null ? dto.description() : "N/A");
                item.setLineAmount(dto.itemAmount() != null ? dto.itemAmount() : BigDecimal.ZERO);
                item.setCreatedBy(userId);
                item.setCreatedAt(OffsetDateTime.now());
                lineItems.add(item);
            }
            ltt.setLineItems(lineItems);
        }

        Ltt created = lttService.create(ltt, idempotencyKey.toString(), userId, userRole);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/payment-orders/{id}")
    public ResponseEntity<Ltt> getPaymentOrder(@PathVariable UUID id) {
        // Convert UUID to Long (simplified — in production, UUID would be the actual PK)
        Ltt ltt = lttService.getById(Long.parseLong(id.toString().substring(0, 8), 16));
        return ResponseEntity.ok(ltt);
    }

    @PutMapping("/payment-orders/{id}")
    public ResponseEntity<Ltt> updatePaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("If-Match") String ifMatch,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Ltt updated) {

        long version = Long.parseLong(ifMatch.replace("\"", ""));
        Ltt result = lttService.update(Long.parseLong(id.toString().substring(0, 8), 16), version, userId, updated);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payment-orders/{id}/submit")
    public ResponseEntity<Ltt> submitPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        Ltt result = lttService.submit(Long.parseLong(id.toString().substring(0, 8), 16), userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payment-orders/{id}/approve")
    public ResponseEntity<Ltt> approvePaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        Ltt result = lttService.approve(Long.parseLong(id.toString().substring(0, 8), 16), userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payment-orders/{id}/reject")
    public ResponseEntity<Ltt> rejectPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody RejectBody body) {

        Ltt result = lttService.reject(Long.parseLong(id.toString().substring(0, 8), 16), userId, userRole, body.reason());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payment-orders/{id}/sign")
    public ResponseEntity<Ltt> signPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody SignBody body) {

        Ltt result = lttService.sign(Long.parseLong(id.toString().substring(0, 8), 16), userId, userRole,
                body.signatureData(), body.signerCert());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payment-orders/{id}/send")
    public ResponseEntity<Ltt> sendPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        Ltt result = lttService.send(Long.parseLong(id.toString().substring(0, 8), 16), userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payment-orders/{id}/cancel")
    public ResponseEntity<Ltt> cancelPaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody CancelBody body) {

        Ltt result = lttService.cancel(Long.parseLong(id.toString().substring(0, 8), 16), userId, userRole, body.reason());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payment-orders/{id}/reverse")
    public ResponseEntity<Ltt> reversePaymentOrder(
            @PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody ReverseBody body) {

        Ltt result = lttService.reverse(Long.parseLong(id.toString().substring(0, 8), 16), userId, userRole, body.reason());
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @GetMapping("/payment-orders/{id}/audit-trail")
    public ResponseEntity<Page<LttAudit>> getAuditTrail(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<LttAudit> result = lttService.getAuditTrail(Long.parseLong(id.toString().substring(0, 8), 16), page, size);
        return ResponseEntity.ok(result);
    }

    // Callback endpoint
    @PostMapping("/callback/payment-status")
    public ResponseEntity<CallbackResponse> processCallback(
            @RequestHeader("X-Correlation-Id") UUID correlationId,
            @RequestBody CallbackBody body) {

        Ltt result = lttService.processCallback(
                correlationId.toString(), body.status(), body.errorCode(),
                body.errorMessage(), body.providerRefId());

        CallbackResponse response = new CallbackResponse("00", "Acknowledged");
        return ResponseEntity.ok(response);
    }

    // Reference data stubs
    @GetMapping("/dm/channels")
    public ResponseEntity<List<RefDataItem>> getChannels() {
        return ResponseEntity.ok(List.of(
                new RefDataItem("LNH", "Lien ngan hang", "NHNN/CITAD", "ACTIVE"),
                new RefDataItem("SP", "Song phuong", "NHTM", "ACTIVE"),
                new RefDataItem("LKB", "Lien kho bac", "KBNN", "ACTIVE")
        ));
    }

    @GetMapping("/dm/coa-segments")
    public ResponseEntity<Object> getCoaSegments(
            @RequestParam(required = false) String segmentType,
            @RequestParam(required = false) String keyword) {
        // TODO: Lookup from DMHT tables
        return ResponseEntity.ok().build();
    }

    // Inner records for request bodies
    record RejectBody(String reason) {}
    record SignBody(String signatureData, String signerCert) {}
    record CancelBody(String reason) {}
    record ReverseBody(String reason) {}
    record CallbackBody(String status, String errorCode, String errorMessage, String providerRefId) {}
    record CallbackResponse(String responseCode, String responseMessage) {}
    record RefDataItem(String code, String name, String description, String status) {}
}
