package com.kb.ltt.application.usecase;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.domain.exception.InvalidStatusTransitionException;
import com.kb.ltt.domain.exception.OptimisticLockException;
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
 * Returns a READY_FOR_APPROVAL or PENDING_APPROVER order back to the maker for correction.
 * Enforces reason length >= 10 and optimistic locking.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnPayOrderUseCase {

    private static final Set<String> RETURNABLE_STATUSES = Set.of("READY_FOR_APPROVAL", "PENDING_APPROVER");

    private final PayOrderRepository payOrderRepository;
    private final AuditHashChainService auditHashChainService;
    private final ObjectMapper objectMapper;

    public record ReturnRequest(String reason) {}

    @Transactional
    public Map<String, Object> returnToMaker(String id,
                                              ReturnRequest req,
                                              UserContext user,
                                              Long ifMatchVersion,
                                              String ip) {
        // 1. Find entity
        PayOrderEntity entity = payOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "MSG-ERR-NOT-FOUND", "PayOrder not found: " + id));

        // Check version
        if (ifMatchVersion != null && !ifMatchVersion.equals(entity.getVersion())) {
            throw new OptimisticLockException(ifMatchVersion, entity.getVersion());
        }

        // 2. Check status
        if (!RETURNABLE_STATUSES.contains(entity.getStatus())) {
            throw new InvalidStatusTransitionException(
                    PayOrderStatus.valueOf(entity.getStatus()), "RETURN");
        }

        // 3. Validate reason length
        String reason = req != null ? req.reason() : null;
        if (reason == null || reason.length() < 10) {
            throw new BusinessException("MSG-ERR-VALIDATION", "Lý do phải ≥ 10 ký tự");
        }

        Long versionBefore = entity.getVersion();
        String oldStatus = entity.getStatus();
        Instant now = Instant.now();

        // 4. Update status
        entity.setStatus("RETURNED_TO_MAKER");
        entity.setUpdatedBy(user.userId());
        entity.setUpdatedAt(now);
        entity.setUpdatedIp(ip);

        // 5. Set comment fields based on role
        if (user.isChecker()) {
            // Checker returning from READY_FOR_APPROVAL
            if (entity.getCheckerActionAt() == null) {
                entity.setCheckerActionAt(now);
            }
            entity.setCheckerComment(reason);
            entity.setCheckerId(entity.getCheckerId() != null ? entity.getCheckerId() : user.userId());
        } else if (user.isApprover()) {
            // Approver returning from PENDING_APPROVER
            entity.setApproverComment(reason);
            entity.setApproverActionAt(now);
            if (entity.getApproverId() == null) {
                entity.setApproverId(user.userId());
            }
        } else {
            // Fallback: set checker comment if returning from READY_FOR_APPROVAL, else approver
            if ("READY_FOR_APPROVAL".equals(oldStatus)) {
                if (entity.getCheckerActionAt() == null) {
                    entity.setCheckerActionAt(now);
                }
                entity.setCheckerComment(reason);
                if (entity.getCheckerId() == null) {
                    entity.setCheckerId(user.userId());
                }
            } else {
                entity.setApproverComment(reason);
                entity.setApproverActionAt(now);
                if (entity.getApproverId() == null) {
                    entity.setApproverId(user.userId());
                }
            }
        }

        // 6. Save
        PayOrderEntity saved = payOrderRepository.save(entity);

        // 7. Audit
        auditHashChainService.record(
                "PAY_ORDER", id, "RETURN",
                user.userId(), ip,
                versionBefore, saved.getVersion(),
                toJson(Map.of("oldStatus", oldStatus, "newStatus", "RETURNED_TO_MAKER", "reason", reason)));

        // 8. Log notification to Maker
        log.info("[NOTIFY] Maker={} — lệnh order={} đã bị trả lại bởi user={} với lý do: {}",
                entity.getCreatedBy(), id, user.userId(), reason);

        // 9. Return result
        return Map.of(
                "id", id,
                "status", "RETURNED_TO_MAKER",
                "version", saved.getVersion(),
                "message", "MSG-OK-RETURN: Đã trả lại lệnh cho người lập.");
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
