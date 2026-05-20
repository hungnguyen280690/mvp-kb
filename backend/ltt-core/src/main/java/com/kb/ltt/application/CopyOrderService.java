package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.CopyOrderUseCase;
import com.kb.ltt.port.in.PayOrderResponse;
import com.kb.ltt.port.out.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Copy (clone) order: clone existing into new DRAFT with new REF_NO.
 * BDD: bdd-07-scenario-01.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CopyOrderService implements CopyOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdempotencyStore idempotencyStore;
    private final RefNoGenerator refNoGenerator;

    @Override
    @Transactional
    public PayOrderResponse copy(CopyCommand cmd) {
        // Idempotency check
        if (cmd.idempotencyKey() != null) {
            var cached = idempotencyStore.findByKey(cmd.idempotencyKey());
            if (cached.isPresent()) {
                return null; // Simplified
            }
        }

        PayOrder source = payOrderRepository.findById(cmd.sourceId())
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan nguon voi id=" + cmd.sourceId()));

        // Generate new REF_NO
        String newRefNo = refNoGenerator.generate(source.getKbnnId());

        // Delegate to domain — validates not DELETED, creates copy
        PayOrder copy = source.copy(cmd.userId(), cmd.userIp(), newRefNo, cmd.idempotencyKey());

        PayOrder saved = payOrderRepository.save(copy);

        // Audit log
        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER", saved.getId(), "COPY", cmd.userId(),
                OffsetDateTime.now(), cmd.userIp(), null, null,
                null, "{\"copiedFrom\":\"" + cmd.sourceId() + "\",\"refNo\":\"" + saved.getRefNo() + "\"}",
                null, 1,
                null, null
        ));

        // Store idempotency
        if (cmd.idempotencyKey() != null) {
            OffsetDateTime now = OffsetDateTime.now();
            idempotencyStore.store(cmd.idempotencyKey(), new IdempotencyStore.StoredResponse(
                    cmd.idempotencyKey(), null, "POST /api/pay-out-manual/" + cmd.sourceId() + "/copy",
                    201, saved.getId(), cmd.userId(), now, now.plusHours(24)
            ));
        }

        return PayOrderResponseMapper.toResponse(saved);
    }
}
