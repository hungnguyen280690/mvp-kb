package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.exception.*;
import com.kb.ltt.port.in.CheckApproveUseCase;
import com.kb.ltt.port.out.*;
import com.kb.ltt.interfaces.rest.dto.PayOrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Check-approve (Checker) use case implementation.
 * SoD check: checkerId != createdBy. READY_FOR_APPROVAL -> PENDING_APPROVER.
 *
 * BDD coverage:
 * - bdd-05-check-approve.md — Scenario 1: Happy path — Checker approves
 * - bdd-05-check-approve.md — Scenario 2: SoD violation — same user as Maker
 * - bdd-05-check-approve.md — Scenario 3: Wrong status — reject
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CheckApproveService implements CheckApproveUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdempotencyStore idempotencyStore;
    private final NotificationSender notificationSender;

    @Override
    @Transactional
    public PayOrderResponse checkApprove(String orderId, Integer expectedVersion,
                                          String checkerId, String comment,
                                          String ipAddress, String idempotencyKey) {
        // Idempotency check
        if (idempotencyKey != null) {
            var cached = idempotencyStore.findByKey(idempotencyKey);
            if (cached != null) {
                return (PayOrderResponse) cached;
            }
        }

        PayOrder order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + orderId));

        // BDD: bdd-05-check-approve.md — Scenario 3: Wrong status
        if (order.getStatus() != OrderStatus.READY_FOR_APPROVAL) {
            throw new InvalidStateTransitionException("MSG-ERR-STATUS",
                    "Chi co the check-approve lenh o trang thai READY_FOR_APPROVAL. Hien tai: " + order.getStatus());
        }

        // BDD: bdd-05-check-approve.md — Scenario 2: SoD check — checker must differ from maker
        if (order.getCreatedBy().equals(checkerId)) {
            throw new SoDViolationException("MSG-ERR-SOD",
                    "Checker khong duoc cung nguoi voi Maker (createdBy=" + order.getCreatedBy() + ")");
        }

        // Optimistic lock check
        if (expectedVersion != null && !order.getVersion().equals(expectedVersion)) {
            throw new OptimisticLockException("MSG-ERR-LOCK",
                    "Ban ghi da bi thay doi. Version hien tai=" + order.getVersion());
        }

        int versionBefore = order.getVersion();
        OffsetDateTime now = OffsetDateTime.now();

        // Transition: READY_FOR_APPROVAL -> PENDING_APPROVER
        order.setStatus(OrderStatus.PENDING_APPROVER);
        order.setCheckerId(checkerId);
        order.setCheckerActionAt(now);
        order.setCheckerComment(comment);
        order.setVersion(order.getVersion() + 1);
        order.setUpdatedBy(checkerId);
        order.setUpdatedAt(now);
        order.setUpdatedIp(ipAddress);

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(AuditLogEntry.builder()
                .entityType("PAY_ORDER")
                .entityId(saved.getId())
                .action("CHECK_APPROVE")
                .performedBy(checkerId)
                .performedAt(now)
                .ipAddress(ipAddress)
                .versionBefore(versionBefore)
                .versionAfter(saved.getVersion())
                .build());

        // Notification to approvers
        notificationSender.send("APPROVER_GROUP", "ORDER_CHECK_APPROVED",
                java.util.Map.of("orderId", saved.getId(), "refNo", saved.getRefNo()));

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
