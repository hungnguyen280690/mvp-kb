package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.domain.exception.InvalidStateTransitionException;
import com.kb.ltt.domain.exception.OptimisticLockException;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.DeleteOrderUseCase;
import com.kb.ltt.port.out.AuditLogRepository;
import com.kb.ltt.port.out.IdempotencyStore;
import com.kb.ltt.port.out.PayOrderRepository;
import com.kb.ltt.interfaces.rest.dto.PayOrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Delete order use case implementation.
 * Only DRAFT/RETURNED status. Requires reason 10-500 chars + confirmed=true.
 *
 * BDD coverage:
 * - bdd-03-delete.md — Scenario 1: Happy path — Maker soft-deletes DRAFT
 * - bdd-03-delete.md — Scenario 2: Reason too short — reject
 * - bdd-03-delete.md — Scenario 3: Not confirmed — reject
 * - bdd-03-delete.md — Scenario 4: Wrong status — reject
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeleteOrderService implements DeleteOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdempotencyStore idempotencyStore;

    @Override
    @Transactional
    public PayOrderResponse delete(String orderId, String deleteReason, Boolean confirmed,
                                   Integer expectedVersion, String userId, String ipAddress, String idempotencyKey) {
        // Idempotency check
        if (idempotencyKey != null) {
            var cached = idempotencyStore.findByKey(idempotencyKey);
            if (cached != null) {
                return (PayOrderResponse) cached;
            }
        }

        // BDD: bdd-03-delete.md — Scenario 3: Not confirmed
        if (confirmed == null || !confirmed) {
            throw new BusinessRuleException("MSG-ERR-VALIDATION", "CONFIRMED phai la true de xoa lenh.");
        }

        // BDD: bdd-03-delete.md — Scenario 2: Reason length
        if (deleteReason == null || deleteReason.length() < 10 || deleteReason.length() > 500) {
            throw new BusinessRuleException("MSG-ERR-VALIDATION",
                    "DELETE_REASON phai tu 10 den 500 ky tu (hien tai: "
                    + (deleteReason != null ? deleteReason.length() : 0) + ").");
        }

        PayOrder order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + orderId));

        // Ownership check
        if (!order.getCreatedBy().equals(userId)) {
            throw new BusinessRuleException("MSG-ERR-PERMISSION",
                    "Chi Maker goc moi duoc xoa lenh nay.");
        }

        // BDD: bdd-03-delete.md — Scenario 4: Status check — only DRAFT or RETURNED_TO_MAKER
        if (order.getStatus() != OrderStatus.DRAFT && order.getStatus() != OrderStatus.RETURNED_TO_MAKER) {
            throw new InvalidStateTransitionException("MSG-ERR-STATUS",
                    "Khong the xoa lenh o trang thai " + order.getStatus());
        }

        // Optimistic lock check
        if (expectedVersion != null && !order.getVersion().equals(expectedVersion)) {
            throw new OptimisticLockException("MSG-ERR-LOCK",
                    "Ban ghi da bi thay doi. Version hien tai=" + order.getVersion());
        }

        int versionBefore = order.getVersion();
        OffsetDateTime now = OffsetDateTime.now();

        // Soft delete — set status to DELETED
        order.setStatus(OrderStatus.DELETED);
        order.setDeleteReason(deleteReason);
        order.setDeletedBy(userId);
        order.setDeletedAt(now);
        order.setDeletedIp(ipAddress);
        order.setVersion(order.getVersion() + 1);
        order.setUpdatedBy(userId);
        order.setUpdatedAt(now);
        order.setUpdatedIp(ipAddress);

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(AuditLogEntry.builder()
                .entityType("PAY_ORDER")
                .entityId(saved.getId())
                .action("DELETE")
                .performedBy(userId)
                .performedAt(now)
                .ipAddress(ipAddress)
                .versionBefore(versionBefore)
                .versionAfter(saved.getVersion())
                .build());

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
                .updatedIp(order.getUpdatedIp()).deleteReason(order.getDeleteReason())
                .deletedBy(order.getDeletedBy()).deletedAt(order.getDeletedAt())
                .build();
    }
}
