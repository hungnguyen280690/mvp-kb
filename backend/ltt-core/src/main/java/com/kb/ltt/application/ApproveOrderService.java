package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.ApproveOrderUseCase;
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
 * Approver phe duyet cuoi: PENDING_APPROVER -> APPROVED.
 * BDD: bdd-04-scenario-03.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApproveOrderService implements ApproveOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationSender notificationSender;

    @Override
    @Transactional
    public PayOrderResponse approve(WorkflowCommand cmd) {
        PayOrder order = payOrderRepository.findById(cmd.id())
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + cmd.id()));

        int versionBefore = (int) order.getVersion();

        // Delegate to domain — validates status, SoD (approver != maker, != checker), optimistic lock
        order.approve(cmd.userId(), cmd.userIp(), cmd.expectedVersion());

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER", saved.getId(), "APPROVE", cmd.userId(),
                OffsetDateTime.now(), cmd.userIp(), null, null,
                null, null,
                versionBefore, (int) saved.getVersion(),
                null, null
        ));

        // Notify maker
        notificationSender.send(order.getCreatedBy(), "ORDER_APPROVED",
                Map.of("orderId", saved.getId(), "refNo", saved.getRefNo()));

        return PayOrderResponseMapper.toResponse(saved);
    }
}
