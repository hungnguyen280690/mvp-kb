package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.enums.PerformedRole;
import com.kb.ltt.domain.exception.*;
import com.kb.ltt.port.in.ReturnOrderUseCase;
import com.kb.ltt.port.out.*;
import com.kb.ltt.interfaces.rest.dto.PayOrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Return order use case implementation.
 * By Checker or Approver. READY_FOR_APPROVAL/PENDING_APPROVER -> RETURNED_TO_MAKER.
 * Reason >= 10 chars required.
 *
 * BDD coverage:
 * - bdd-07-return-reject.md — Scenario 1: Checker returns — happy path
 * - bdd-07-return-reject.md — Scenario 2: Approver returns — happy path
 * - bdd-07-return-reject.md — Scenario 3: Reason too short — reject
 * - bdd-07-return-reject.md — Scenario 4: SoD violation — Checker same as Maker
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnOrderService implements ReturnOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdempotencyStore idempotencyStore;
    private final NotificationSender notificationSender;

    @Override
    @Transactional
    public PayOrderResponse returnOrder(String orderId, Integer expectedVersion,
                                         String performedBy, String reason,
                                         String ipAddress, String idempotencyKey) {
        // Idempotency check
        if (idempotencyKey != null) {
            var cached = idempotencyStore.findByKey(idempotencyKey);
            if (cached != null) {
                return (PayOrderResponse) cached;
            }
        }

        // BDD: bdd-07-return-reject.md — Scenario 3: Reason too short
        if (reason == null || reason.length() < 10) {
            throw new BusinessRuleException("MSG-ERR-VALIDATION",
                    "REASON phai co it nhat 10 ky tu (hien tai: " + (reason != null ? reason.length() : 0) + ").");
        }
        if (reason.length() > 500) {
            throw new BusinessRuleException("MSG-ERR-VALIDATION",
                    "REASON khong duoc qua 500 ky tu.");
        }

        PayOrder order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + orderId));

        // Status check — only READY_FOR_APPROVAL or PENDING_APPROVER
        if (order.getStatus() != OrderStatus.READY_FOR_APPROVAL
                && order.getStatus() != OrderStatus.PENDING_APPROVER) {
            throw new InvalidStateTransitionException("MSG-ERR-STATUS",
                    "Chi co the return lenh o trang thai READY_FOR_APPROVAL hoac PENDING_APPROVER. Hien tai: " + order.getStatus());
        }

        // BDD: bdd-07-return-reject.md — Scenario 4: SoD check
        if (order.getCreatedBy().equals(performedBy)) {
            throw new SoDViolationException("MSG-ERR-SOD",
                    "Nguoi return khong duoc cung nguoi voi Maker.");
        }

        // Optimistic lock check
        if (expectedVersion != null && !order.getVersion().equals(expectedVersion)) {
            throw new OptimisticLockException("MSG-ERR-LOCK",
                    "Ban ghi da bi thay doi. Version hien tai=" + order.getVersion());
        }

        int versionBefore = order.getVersion();
        OffsetDateTime now = OffsetDateTime.now();
        String action;

        // Determine if Checker or Approver is returning
        if (order.getStatus() == OrderStatus.READY_FOR_APPROVAL) {
            // Checker returning
            order.setCheckerId(performedBy);
            order.setCheckerActionAt(now);
            order.setCheckerComment(reason);
            action = "RETURN_BY_CHECKER";
        } else {
            // Approver returning (PENDING_APPROVER)
            if (order.getCheckerId() != null && order.getCheckerId().equals(performedBy)) {
                throw new SoDViolationException("MSG-ERR-SOD",
                        "Approver khong duoc cung nguoi voi Checker khi return.");
            }
            order.setApproverId(performedBy);
            order.setApproverActionAt(now);
            order.setApproverComment(reason);
            action = "RETURN_BY_APPROVER";
        }

        // Transition to RETURNED_TO_MAKER
        order.setStatus(OrderStatus.RETURNED_TO_MAKER);
        order.setVersion(order.getVersion() + 1);
        order.setUpdatedBy(performedBy);
        order.setUpdatedAt(now);
        order.setUpdatedIp(ipAddress);

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(AuditLogEntry.builder()
                .entityType("PAY_ORDER")
                .entityId(saved.getId())
                .action(action)
                .performedBy(performedBy)
                .performedAt(now)
                .ipAddress(ipAddress)
                .versionBefore(versionBefore)
                .versionAfter(saved.getVersion())
                .build());

        // Notify maker
        notificationSender.send(order.getCreatedBy(), "ORDER_RETURNED",
                java.util.Map.of("orderId", saved.getId(), "refNo", saved.getRefNo(), "reason", reason));

        return toResponse(saved);
    }

    private PayOrderResponse toResponse(PayOrder order) {
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
                .receiverIssuedPlace(order.getReceiverIssuedPlace())
                .kbnnId(order.getKbnnId()).createdBy(order.getCreatedBy()).createdAt(order.getCreatedAt())
                .createdIp(order.getCreatedIp()).updatedBy(order.getUpdatedBy()).updatedAt(order.getUpdatedAt())
                .updatedIp(order.getUpdatedIp()).checkerId(order.getCheckerId())
                .checkerActionAt(order.getCheckerActionAt()).checkerComment(order.getCheckerComment())
                .approverId(order.getApproverId()).approverActionAt(order.getApproverActionAt())
                .approverComment(order.getApproverComment()).attachmentCount(0)
                .build();
    }
}
