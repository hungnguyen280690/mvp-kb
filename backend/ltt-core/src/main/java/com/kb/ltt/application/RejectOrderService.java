package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.enums.PerformedRole;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.PayOrderResponse;
import com.kb.ltt.port.in.RejectOrderUseCase;
import com.kb.ltt.port.in.ReturnRejectCommand;
import com.kb.ltt.port.out.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Reject order: READY_FOR_APPROVAL/PENDING_APPROVER -> REJECTED.
 * BDD: bdd-04-scenario-02 (Checker reject), bdd-04-scenario-04 (Approver reject).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RejectOrderService implements RejectOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationSender notificationSender;

    @Override
    @Transactional
    public PayOrderResponse reject(ReturnRejectCommand cmd) {
        PayOrder order = payOrderRepository.findById(cmd.id())
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + cmd.id()));

        int versionBefore = (int) order.getVersion();

        // Determine role from current status
        PerformedRole role = order.getStatus() == OrderStatus.READY_FOR_APPROVAL
                ? PerformedRole.CHECKER
                : PerformedRole.APPROVER;

        // Delegate to domain — validates status, SoD, reason, optimistic lock
        order.reject(cmd.userId(), role, cmd.userIp(), cmd.reason(), cmd.expectedVersion());

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        String action = role == PerformedRole.CHECKER ? "REJECT_BY_CHECKER" : "REJECT_BY_APPROVER";
        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER", saved.getId(), action, cmd.userId(),
                OffsetDateTime.now(), cmd.userIp(), null, null,
                null, null,
                versionBefore, (int) saved.getVersion(),
                null, null
        ));

        // Notify maker
        notificationSender.send(order.getCreatedBy(), "ORDER_REJECTED",
                Map.of("orderId", saved.getId(), "refNo", saved.getRefNo(), "reason", cmd.reason()));

        return PayOrderResponseMapper.toResponse(saved);
    }
}
