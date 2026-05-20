package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.DeleteOrderUseCase;
import com.kb.ltt.port.out.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Soft-delete: DRAFT/RETURNED_TO_MAKER -> DELETED.
 * BDD: bdd-06-scenario-01.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeleteOrderService implements DeleteOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public void delete(DeleteOrderCommand cmd) {
        PayOrder order = payOrderRepository.findById(cmd.id())
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + cmd.id()));

        int versionBefore = (int) order.getVersion();

        // Delegate to domain — validates status, ownership, reason length, optimistic lock
        order.softDelete(cmd.userId(), cmd.userIp(), cmd.deleteReason(), cmd.expectedVersion());

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER", saved.getId(), "DELETE", cmd.userId(),
                OffsetDateTime.now(), cmd.userIp(), null, null,
                null, null,
                versionBefore, (int) saved.getVersion(),
                null, null
        ));
    }
}
