package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.PayOrderLine;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.domain.exception.InvalidStateTransitionException;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.UpdateOrderUseCase;
import com.kb.ltt.port.out.*;
import com.kb.ltt.interfaces.rest.dto.PayOrderResponse;
import com.kb.ltt.interfaces.rest.dto.UpdateOrderRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Update order use case implementation.
 * Only DRAFT/RETURNED_TO_MAKER status. Checks Maker ownership. Validates period OPEN.
 *
 * BDD coverage:
 * - bdd-02-update.md — Scenario 1: Happy path — Maker updates DRAFT
 * - bdd-02-update.md — Scenario 2: Update RETURNED_TO_MAKER order
 * - bdd-02-update.md — Scenario 3: Wrong status — reject
 * - bdd-02-update.md — Scenario 4: Non-owner Maker — reject
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UpdateOrderService implements UpdateOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdempotencyStore idempotencyStore;
    private final PeriodControlGateway periodControlGateway;

    @Override
    @Transactional
    public PayOrderResponse update(String orderId, UpdateOrderRequest request, Integer expectedVersion,
                                   String userId, String ipAddress, String idempotencyKey) {
        // BDD: bdd-02-update.md — Idempotency check
        if (idempotencyKey != null) {
            var cached = idempotencyStore.findByKey(idempotencyKey);
            if (cached != null) {
                return (PayOrderResponse) cached;
            }
        }

        PayOrder order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + orderId));

        // BDD: bdd-02-update.md — Scenario 4: Ownership check
        if (!order.getCreatedBy().equals(userId)) {
            throw new BusinessRuleException("MSG-ERR-PERMISSION",
                    "Chi Maker goc moi duoc cap nhat lenh nay. createdBy=" + order.getCreatedBy());
        }

        // BDD: bdd-02-update.md — Scenario 3: Status check — only DRAFT or RETURNED_TO_MAKER
        if (order.getStatus() != OrderStatus.DRAFT && order.getStatus() != OrderStatus.RETURNED_TO_MAKER) {
            throw new InvalidStateTransitionException("MSG-ERR-STATUS",
                    "Khong the cap nhat lenh o trang thai " + order.getStatus());
        }

        // Optimistic lock check
        if (expectedVersion != null && !order.getVersion().equals(expectedVersion)) {
            throw new com.kb.ltt.domain.exception.OptimisticLockException("MSG-ERR-LOCK",
                    "Ban ghi da bi thay doi. Version hien tai=" + order.getVersion() + ", ban gui=" + expectedVersion);
        }

        // Period OPEN validation (if payment date changed)
        if (request.getPaymentDate() != null) {
            if (!periodControlGateway.isOpen(order.getKbnnId(), request.getPaymentDate())) {
                throw new BusinessRuleException("MSG-ERR-PERIOD",
                        "Ky ke thao khong mo cho PAYMENT_DATE=" + request.getPaymentDate());
            }
        }

        // Apply updates (partial)
        int versionBefore = order.getVersion();
        OffsetDateTime now = OffsetDateTime.now();

        if (request.getChannel() != null) order.setChannel(request.getChannel());
        if (request.getOrderType() != null) order.setOrderType(request.getOrderType());
        if (request.getLnhTransactionType() != null) order.setLnhTransactionType(request.getLnhTransactionType());
        if (request.getSender() != null) order.setSender(request.getSender());
        if (request.getReceiver() != null) order.setReceiver(request.getReceiver());
        if (request.getPaymentDate() != null) order.setPaymentDate(request.getPaymentDate());
        if (request.getAmount() != null) order.setAmount(request.getAmount());
        if (request.getCurrencyCode() != null) order.setCurrencyCode(request.getCurrencyCode());
        if (request.getExchangeRate() != null) order.setExchangeRate(request.getExchangeRate());
        if (request.getOriginNum() != null) order.setOriginNum(request.getOriginNum());
        if (request.getTransactionDate() != null) order.setTransactionDate(request.getTransactionDate());
        if (request.getExpType() != null) order.setExpType(request.getExpType());
        if (request.getFnCode1() != null) order.setFnCode1(request.getFnCode1());
        if (request.getFnCode2() != null) order.setFnCode2(request.getFnCode2());
        if (request.getFnAmount() != null) order.setFnAmount(request.getFnAmount());
        if (request.getDescription() != null) order.setDescription(request.getDescription());
        if (request.getSenderName() != null) order.setSenderName(request.getSenderName());
        if (request.getSenderAddress() != null) order.setSenderAddress(request.getSenderAddress());
        if (request.getSenderGlSegment2() != null) order.setSenderGlSegment2(request.getSenderGlSegment2());
        if (request.getSenderNum() != null) order.setSenderNum(request.getSenderNum());
        if (request.getSenderBankCode() != null) order.setSenderBankCode(request.getSenderBankCode());
        if (request.getSenderIdentifyId() != null) order.setSenderIdentifyId(request.getSenderIdentifyId());
        if (request.getSenderIssuedDate() != null) order.setSenderIssuedDate(request.getSenderIssuedDate());
        if (request.getSenderIssuedPlace() != null) order.setSenderIssuedPlace(request.getSenderIssuedPlace());
        if (request.getTpcpCode() != null) order.setTpcpCode(request.getTpcpCode());
        if (request.getReceiverName() != null) order.setReceiverName(request.getReceiverName());
        if (request.getReceiverAddress() != null) order.setReceiverAddress(request.getReceiverAddress());
        if (request.getReceiverGlSegment2() != null) order.setReceiverGlSegment2(request.getReceiverGlSegment2());
        if (request.getReceiverBankCode() != null) order.setReceiverBankCode(request.getReceiverBankCode());
        if (request.getReceiverAccountName() != null) order.setReceiverAccountName(request.getReceiverAccountName());
        if (request.getReceiverIdentifyId() != null) order.setReceiverIdentifyId(request.getReceiverIdentifyId());
        if (request.getReceiverIssuedDate() != null) order.setReceiverIssuedDate(request.getReceiverIssuedDate());
        if (request.getReceiverIssuedPlace() != null) order.setReceiverIssuedPlace(request.getReceiverIssuedPlace());

        // Lines: full replacement
        if (request.getLines() != null && !request.getLines().isEmpty()) {
            List<PayOrderLine> newLines = new ArrayList<>();
            for (int i = 0; i < request.getLines().size(); i++) {
                var lr = request.getLines().get(i);
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
                newLines.add(line);
            }
            order.setLines(newLines);
        }

        order.setUpdatedBy(userId);
        order.setUpdatedAt(now);
        order.setUpdatedIp(ipAddress);
        order.setVersion(order.getVersion() + 1);

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(AuditLogEntry.builder()
                .entityType("PAY_ORDER")
                .entityId(saved.getId())
                .action("UPDATE")
                .performedBy(userId)
                .performedAt(now)
                .ipAddress(ipAddress)
                .versionBefore(versionBefore)
                .versionAfter(saved.getVersion())
                .build());

        return toResponse(saved);
    }

    private PayOrderResponse toResponse(PayOrder order) {
        List<PayOrderResponse.PayOrderLineResponse> lineResponses = new ArrayList<>();
        if (order.getLines() != null) {
            for (PayOrderLine l : order.getLines()) {
                lineResponses.add(PayOrderResponse.PayOrderLineResponse.builder()
                        .id(l.getId()).orderId(l.getOrderId()).lineNo(l.getLineNo())
                        .glSegment1(l.getGlSegment1()).glSegment2(l.getGlSegment2())
                        .glSegment3(l.getGlSegment3()).glSegment4(l.getGlSegment4())
                        .glSegment5(l.getGlSegment5()).glSegment6(l.getGlSegment6())
                        .glSegment7(l.getGlSegment7()).glSegment8(l.getGlSegment8())
                        .glSegment9(l.getGlSegment9()).glSegment10(l.getGlSegment10())
                        .glSegment11(l.getGlSegment11()).glSegment12(l.getGlSegment12())
                        .ccidKey(l.getCcidKey()).lineDescription(l.getLineDescription())
                        .lineAmount(l.getLineAmount()).createdAt(l.getCreatedAt()).updatedAt(l.getUpdatedAt())
                        .build());
            }
        }
        return PayOrderResponse.builder()
                .id(order.getId()).version(order.getVersion()).status(order.getStatus().name())
                .refNo(order.getRefNo()).channel(order.getChannel()).orderType(order.getOrderType())
                .lnhTransactionType(order.getLnhTransactionType()).sender(order.getSender())
                .receiver(order.getReceiver()).paymentDate(order.getPaymentDate()).amount(order.getAmount())
                .currencyCode(order.getCurrencyCode()).exchangeRate(order.getExchangeRate())
                .originNum(order.getOriginNum()).transactionDate(order.getTransactionDate())
                .expType(order.getExpType()).fnCode1(order.getFnCode1()).fnCode2(order.getFnCode2())
                .fnAmount(order.getFnAmount()).description(order.getDescription())
                .senderName(order.getSenderName()).senderAddress(order.getSenderAddress())
                .senderGlSegment2(order.getSenderGlSegment2()).senderNum(order.getSenderNum())
                .senderBankCode(order.getSenderBankCode()).senderIdentifyId(order.getSenderIdentifyId())
                .senderIssuedDate(order.getSenderIssuedDate()).senderIssuedPlace(order.getSenderIssuedPlace())
                .tpcpCode(order.getTpcpCode()).receiverName(order.getReceiverName())
                .receiverAddress(order.getReceiverAddress()).receiverGlSegment2(order.getReceiverGlSegment2())
                .receiverBankCode(order.getReceiverBankCode()).receiverAccountName(order.getReceiverAccountName())
                .receiverIdentifyId(order.getReceiverIdentifyId()).receiverIssuedDate(order.getReceiverIssuedDate())
                .receiverIssuedPlace(order.getReceiverIssuedPlace()).lines(lineResponses)
                .kbnnId(order.getKbnnId()).createdBy(order.getCreatedBy()).createdAt(order.getCreatedAt())
                .createdIp(order.getCreatedIp()).updatedBy(order.getUpdatedBy()).updatedAt(order.getUpdatedAt())
                .updatedIp(order.getUpdatedIp()).checkerId(order.getCheckerId())
                .checkerActionAt(order.getCheckerActionAt()).checkerComment(order.getCheckerComment())
                .approverId(order.getApproverId()).approverActionAt(order.getApproverActionAt())
                .approverComment(order.getApproverComment()).deleteReason(order.getDeleteReason())
                .deletedBy(order.getDeletedBy()).deletedAt(order.getDeletedAt()).attachmentCount(0)
                .build();
    }
}
