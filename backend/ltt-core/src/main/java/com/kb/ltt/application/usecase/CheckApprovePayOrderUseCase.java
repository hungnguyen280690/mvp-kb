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

/**
 * Checker approves a READY_FOR_APPROVAL order and forwards it to the Approver.
 * Enforces SoD (checker ≠ maker) and optimistic locking.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CheckApprovePayOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditHashChainService auditHashChainService;
    private final ObjectMapper objectMapper;

    public record CheckApproveRequest(String comment) {}

    @Transactional
    public Map<String, Object> checkApprove(String id,
                                             CheckApproveRequest req,
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

        // 2. Check status: must be READY_FOR_APPROVAL
        if (!"READY_FOR_APPROVAL".equals(entity.getStatus())) {
            throw new InvalidStatusTransitionException(
                    PayOrderStatus.valueOf(entity.getStatus()), "CHECK_APPROVE");
        }

        // 3. SoD: checker must not be the maker
        if (user.userId().equals(entity.getCreatedBy())) {
            throw new SoDViolationException(
                    "Checker không được là người lập lệnh. createdBy=" + entity.getCreatedBy());
        }

        Long versionBefore = entity.getVersion();

        // 4-5. Update status and checker fields
        entity.setStatus("PENDING_APPROVER");
        entity.setCheckerId(user.userId());
        entity.setCheckerActionAt(Instant.now());
        entity.setCheckerComment(req != null ? req.comment() : null);
        entity.setUpdatedBy(user.userId());
        entity.setUpdatedAt(Instant.now());
        entity.setUpdatedIp(ip);

        // 6. Save
        PayOrderEntity saved = payOrderRepository.save(entity);

        // 7. Audit
        auditHashChainService.record(
                "PAY_ORDER", id, "CHECK_APPROVE",
                user.userId(), ip,
                versionBefore, saved.getVersion(),
                toJson(Map.of("oldStatus", "READY_FOR_APPROVAL", "newStatus", "PENDING_APPROVER")));

        // 8. Log notification to Approver
        log.info("[NOTIFY] Approver cần phê duyệt lệnh order={} được kiểm soát bởi checker={}", id, user.userId());

        // 9. Return result
        return Map.of(
                "id", id,
                "status", "PENDING_APPROVER",
                "version", saved.getVersion(),
                "message", "MSG-OK-CHECK: Đã kiểm soát và chuyển lên phê duyệt.");
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
