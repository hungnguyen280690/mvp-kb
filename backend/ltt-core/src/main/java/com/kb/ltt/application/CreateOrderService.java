package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.PayOrderLine;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.port.in.CreateOrderUseCase;
import com.kb.ltt.port.out.*;
import com.kb.ltt.interfaces.rest.dto.CreateOrderRequest;
import com.kb.ltt.interfaces.rest.dto.PayOrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Create order use case implementation.
 * Validates period OPEN, generates REF_NO, creates PayOrder in DRAFT status.
 *
 * BDD coverage:
 * - bdd-01-create.md — Scenario 1: Happy path — Maker creates DRAFT order
 * - bdd-01-create.md — Scenario 2: Period closed — reject with MSG-ERR-PERIOD
 * - bdd-01-create.md — Scenario 3: Idempotency — return cached response
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CreateOrderService implements CreateOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdempotencyStore idempotencyStore;
    private final RefNoGenerator refNoGenerator;
    private final PeriodControlGateway periodControlGateway;
    private final NotificationSender notificationSender;

    @Override
    @Transactional
    public PayOrderResponse create(CreateOrderRequest request, String userId, String kbnnId, String ipAddress, String idempotencyKey) {
        // BDD: bdd-01-create.md — Scenario 3: Idempotency check
        if (idempotencyKey != null) {
            var cached = idempotencyStore.findByKey(idempotencyKey);
            if (cached != null) {
                log.info("Idempotency hit for key={}", idempotencyKey);
                return (PayOrderResponse) cached;
            }
        }

        // BDD: bdd-01-create.md — Scenario 2: Period closed validation
        if (!periodControlGateway.isOpen(kbnnId, request.getPaymentDate())) {
            throw new BusinessRuleException("MSG-ERR-PERIOD",
                "Ky ke thao khong mo hoac ngay thanh toan ngoai ky. PAYMENT_DATE=" + request.getPaymentDate());
        }

        // Generate REF_NO: <KBNN>-YYYYMM-<seq6>
        String refNo = refNoGenerator.generate(kbnnId);

        // Build domain aggregate
        String orderId = UUID.randomUUID().toString();
        OffsetDateTime now = OffsetDateTime.now();

        List<PayOrderLine> lines = buildLines(request.getLines(), orderId);

        PayOrder order = PayOrder.builder()
                .id(orderId)
                .version(1)
                .status(OrderStatus.DRAFT)
                .refNo(refNo)
                .channel(request.getChannel())
                .orderType(request.getOrderType())
                .lnhTransactionType(request.getLnhTransactionType())
                .sender(request.getSender())
                .receiver(request.getReceiver())
                .paymentDate(request.getPaymentDate())
                .amount(request.getAmount())
                .currencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "VND")
                .exchangeRate(request.getExchangeRate())
                .originNum(request.getOriginNum())
                .transactionDate(request.getTransactionDate())
                .expType(request.getExpType())
                .fnCode1(request.getFnCode1())
                .fnCode2(request.getFnCode2())
                .fnAmount(request.getFnAmount())
                .description(request.getDescription())
                .senderName(request.getSenderName())
                .senderAddress(request.getSenderAddress())
                .senderGlSegment2(request.getSenderGlSegment2())
                .senderNum(request.getSenderNum())
                .senderBankCode(request.getSenderBankCode())
                .senderIdentifyId(request.getSenderIdentifyId())
                .senderIssuedDate(request.getSenderIssuedDate())
                .senderIssuedPlace(request.getSenderIssuedPlace())
                .tpcpCode(request.getTpcpCode())
                .receiverName(request.getReceiverName())
                .receiverAddress(request.getReceiverAddress())
                .receiverGlSegment2(request.getReceiverGlSegment2())
                .receiverBankCode(request.getReceiverBankCode())
                .receiverAccountName(request.getReceiverAccountName())
                .receiverIdentifyId(request.getReceiverIdentifyId())
                .receiverIssuedDate(request.getReceiverIssuedDate())
                .receiverIssuedPlace(request.getReceiverIssuedPlace())
                .kbnnId(kbnnId)
                .createdBy(userId)
                .createdAt(now)
                .createdIp(ipAddress)
                .lines(lines)
                .build();

        // Persist
        PayOrder saved = payOrderRepository.save(order);

        // Audit log — hash chain (ADR-0003)
        auditLogRepository.save(AuditLogEntry.builder()
                .entityType("PAY_ORDER")
                .entityId(saved.getId())
                .action("CREATE")
                .performedBy(userId)
                .performedAt(now)
                .ipAddress(ipAddress)
                .versionBefore(null)
                .versionAfter(1)
                .newValue(toSummaryJson(saved))
                .build());

        // Idempotency store
        if (idempotencyKey != null) {
            PayOrderResponse response = toResponse(saved);
            idempotencyStore.store(idempotencyKey, hashOf(request), "POST /api/pay-out-manual", 201, response);
            return response;
        }

        return toResponse(saved);
    }

    private List<PayOrderLine> buildLines(List<CreateOrderRequest.LineRequest> lineRequests, String orderId) {
        List<PayOrderLine> lines = new ArrayList<>();
        for (int i = 0; i < lineRequests.size(); i++) {
            CreateOrderRequest.LineRequest lr = lineRequests.get(i);
            PayOrderLine line = PayOrderLine.builder()
                    .id(UUID.randomUUID().toString())
                    .orderId(orderId)
                    .lineNo(i + 1)
                    .glSegment1(lr.getGlSegment1() != null ? lr.getGlSegment1() : "01")
                    .glSegment2(lr.getGlSegment2())
                    .glSegment3(lr.getGlSegment3())
                    .glSegment4(lr.getGlSegment4())
                    .glSegment5(lr.getGlSegment5() != null ? lr.getGlSegment5() : "000")
                    .glSegment6(lr.getGlSegment6() != null ? lr.getGlSegment6() : "000")
                    .glSegment7(lr.getGlSegment7() != null ? lr.getGlSegment7() : "0000")
                    .glSegment8(lr.getGlSegment8() != null ? lr.getGlSegment8() : "00000")
                    .glSegment9(lr.getGlSegment9() != null ? lr.getGlSegment9() : "00000")
                    .glSegment10(lr.getGlSegment10() != null ? lr.getGlSegment10() : "00")
                    .glSegment11(lr.getGlSegment11() != null ? lr.getGlSegment11() : "0000")
                    .glSegment12(lr.getGlSegment12() != null ? lr.getGlSegment12() : "000")
                    .lineDescription(lr.getLineDescription())
                    .lineAmount(lr.getLineAmount())
                    .build();
            line.computeCcidKey();
            lines.add(line);
        }
        return lines;
    }

    private String hashOf(Object obj) {
        return Integer.toHexString(System.identityHashCode(obj));
    }

    private String toSummaryJson(PayOrder order) {
        return String.format("{\"id\":\"%s\",\"refNo\":\"%s\",\"status\":\"%s\",\"amount\":%s}",
                order.getId(), order.getRefNo(), order.getStatus().name(), order.getAmount());
    }

    private PayOrderResponse toResponse(PayOrder order) {
        List<PayOrderResponse.PayOrderLineResponse> lineResponses = new ArrayList<>();
        if (order.getLines() != null) {
            for (PayOrderLine l : order.getLines()) {
                lineResponses.add(PayOrderResponse.PayOrderLineResponse.builder()
                        .id(l.getId())
                        .orderId(l.getOrderId())
                        .lineNo(l.getLineNo())
                        .glSegment1(l.getGlSegment1())
                        .glSegment2(l.getGlSegment2())
                        .glSegment3(l.getGlSegment3())
                        .glSegment4(l.getGlSegment4())
                        .glSegment5(l.getGlSegment5())
                        .glSegment6(l.getGlSegment6())
                        .glSegment7(l.getGlSegment7())
                        .glSegment8(l.getGlSegment8())
                        .glSegment9(l.getGlSegment9())
                        .glSegment10(l.getGlSegment10())
                        .glSegment11(l.getGlSegment11())
                        .glSegment12(l.getGlSegment12())
                        .ccidKey(l.getCcidKey())
                        .lineDescription(l.getLineDescription())
                        .lineAmount(l.getLineAmount())
                        .createdAt(l.getCreatedAt())
                        .updatedAt(l.getUpdatedAt())
                        .build());
            }
        }

        return PayOrderResponse.builder()
                .id(order.getId())
                .version(order.getVersion())
                .status(order.getStatus().name())
                .refNo(order.getRefNo())
                .channel(order.getChannel())
                .orderType(order.getOrderType())
                .lnhTransactionType(order.getLnhTransactionType())
                .sender(order.getSender())
                .receiver(order.getReceiver())
                .paymentDate(order.getPaymentDate())
                .amount(order.getAmount())
                .currencyCode(order.getCurrencyCode())
                .exchangeRate(order.getExchangeRate())
                .originNum(order.getOriginNum())
                .transactionDate(order.getTransactionDate())
                .expType(order.getExpType())
                .fnCode1(order.getFnCode1())
                .fnCode2(order.getFnCode2())
                .fnAmount(order.getFnAmount())
                .description(order.getDescription())
                .senderName(order.getSenderName())
                .senderAddress(order.getSenderAddress())
                .senderGlSegment2(order.getSenderGlSegment2())
                .senderNum(order.getSenderNum())
                .senderBankCode(order.getSenderBankCode())
                .senderIdentifyId(order.getSenderIdentifyId())
                .senderIssuedDate(order.getSenderIssuedDate())
                .senderIssuedPlace(order.getSenderIssuedPlace())
                .tpcpCode(order.getTpcpCode())
                .receiverName(order.getReceiverName())
                .receiverAddress(order.getReceiverAddress())
                .receiverGlSegment2(order.getReceiverGlSegment2())
                .receiverBankCode(order.getReceiverBankCode())
                .receiverAccountName(order.getReceiverAccountName())
                .receiverIdentifyId(order.getReceiverIdentifyId())
                .receiverIssuedDate(order.getReceiverIssuedDate())
                .receiverIssuedPlace(order.getReceiverIssuedPlace())
                .lines(lineResponses)
                .kbnnId(order.getKbnnId())
                .createdBy(order.getCreatedBy())
                .createdAt(order.getCreatedAt())
                .createdIp(order.getCreatedIp())
                .updatedBy(order.getUpdatedBy())
                .updatedAt(order.getUpdatedAt())
                .updatedIp(order.getUpdatedIp())
                .checkerId(order.getCheckerId())
                .checkerActionAt(order.getCheckerActionAt())
                .checkerComment(order.getCheckerComment())
                .approverId(order.getApproverId())
                .approverActionAt(order.getApproverActionAt())
                .approverComment(order.getApproverComment())
                .deleteReason(order.getDeleteReason())
                .deletedBy(order.getDeletedBy())
                .deletedAt(order.getDeletedAt())
                .attachmentCount(0)
                .build();
    }
}
