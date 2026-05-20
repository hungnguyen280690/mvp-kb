package com.kb.ltt.application.usecase;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.domain.exception.InvalidStatusTransitionException;
import com.kb.ltt.domain.exception.OptimisticLockException;
import com.kb.ltt.domain.exception.SoDViolationException;
import com.kb.ltt.domain.model.PayOrderStatus;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import com.kb.ltt.infrastructure.service.AuditHashChainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

/**
 * Soft-deletes a PayOrder (sets status=DELETED, records reason and audit trail).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeletePayOrderUseCase {

    private static final Set<String> DELETABLE_STATUSES = Set.of("DRAFT", "RETURNED_TO_MAKER");
    private static final int MIN_REASON_LENGTH = 10;

    private final PayOrderRepository payOrderRepository;
    private final AuditHashChainService auditHashChainService;
    private final ObjectMapper objectMapper;

    /**
     * Input record for a delete request.
     */
    public record DeleteRequest(String deleteReason, boolean confirmed) {}

    @Transactional
    public Map<String, Object> delete(String id,
                                      DeleteRequest req,
                                      UserContext user,
                                      Long ifMatchVersion,
                                      String ip) {
        // 1. Find entity
        PayOrderEntity entity = payOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "MSG-ERR-NOT-FOUND", "PayOrder not found: " + id));

        // 2. Validate input
        if (req.deleteReason() == null || req.deleteReason().length() < MIN_REASON_LENGTH) {
            throw new BusinessException(
                    "MSG-ERR-VALIDATION",
                    "deleteReason must be at least " + MIN_REASON_LENGTH + " characters.");
        }
        if (!req.confirmed()) {
            throw new BusinessException(
                    "MSG-ERR-VALIDATION",
                    "confirmed must be true to proceed with deletion.");
        }

        // 3. Status check
        if (!DELETABLE_STATUSES.contains(entity.getStatus())) {
            throw new InvalidStatusTransitionException(
                    PayOrderStatus.valueOf(entity.getStatus()), "DELETE");
        }

        // 4. SoD: only creator may delete
        if (!user.userId().equals(entity.getCreatedBy())) {
            throw new SoDViolationException(
                    "Only the creator may delete a PayOrder. createdBy=" + entity.getCreatedBy());
        }

        // 5. Optimistic lock
        if (ifMatchVersion != null && !ifMatchVersion.equals(entity.getVersion())) {
            throw new OptimisticLockException(ifMatchVersion, entity.getVersion());
        }

        Long versionBefore = entity.getVersion();

        // 6. Apply soft-delete
        Instant now = Instant.now();
        entity.setStatus("DELETED");
        entity.setDeleteReason(req.deleteReason());
        entity.setDeletedBy(user.userId());
        entity.setDeletedAt(now);
        entity.setDeletedIp(ip);

        // 7. Save
        PayOrderEntity saved = payOrderRepository.save(entity);

        // 8. Audit
        auditHashChainService.record(
                "PAY_ORDER", id, "DELETE",
                user.userId(), ip,
                versionBefore, saved.getVersion(),
                toJson(saved));

        log.info("PayOrder soft-deleted: id={} by={}", id, user.userId());

        // 9. Return result map
        return Map.of(
                "id", id,
                "status", "DELETED",
                "message", "MSG-OK-DELETE: Đã xoá lệnh thanh toán thành công."
        );
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
