package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.CheckApproveUseCase;
import com.kb.ltt.port.in.PayOrderResponse;
import com.kb.ltt.port.in.WorkflowCommand;
import com.kb.ltt.port.out.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Checker phe duyet cap 1: READY_FOR_APPROVAL -> PENDING_APPROVER.
 * BDD: bdd-04-scenario-01.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CheckApproveService implements CheckApproveUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationSender notificationSender;

    @Override
    @Transactional
    public PayOrderResponse checkApprove(WorkflowCommand cmd) {
        PayOrder order = payOrderRepository.findById(cmd.id())
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + cmd.id()));

        int versionBefore = (int) order.getVersion();

        // Delegate to domain — validates status, SoD, optimistic lock
        order.checkApprove(cmd.userId(), cmd.userIp(), cmd.expectedVersion());

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER", saved.getId(), "CHECK_APPROVE", cmd.userId(),
                OffsetDateTime.now(), cmd.userIp(), null, null,
                null, null,
                versionBefore, (int) saved.getVersion(),
                null, null
        ));

        // Notify approvers
        notificationSender.send("APPROVER_GROUP", "ORDER_CHECK_APPROVED",
                Map.of("orderId", saved.getId(), "refNo", saved.getRefNo()));

        return PayOrderResponseMapper.toResponse(saved);
    }
}
