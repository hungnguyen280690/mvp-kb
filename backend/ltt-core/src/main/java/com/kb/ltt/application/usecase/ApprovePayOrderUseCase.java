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
 * Approver approves a PENDING_APPROVER order.
 * Enforces 3-way SoD (approver ≠ maker AND approver ≠ checker) and optimistic locking.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovePayOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditHashChainService auditHashChainService;
    private final ObjectMapper objectMapper;

    public record ApproveRequest(String comment) {}

    @Transactional
    public Map<String, Object> approve(String id,
                                       ApproveRequest req,
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

        // 2. Check status: must be PENDING_APPROVER
        if (!"PENDING_APPROVER".equals(entity.getStatus())) {
            throw new InvalidStatusTransitionException(
                    PayOrderStatus.valueOf(entity.getStatus()), "APPROVE");
        }

        // 3. SoD 3-way: approver ≠ maker AND approver ≠ checker
        if (user.userId().equals(entity.getCreatedBy())) {
            throw new SoDViolationException(
                    "Người phê duyệt không được là người lập lệnh. createdBy=" + entity.getCreatedBy());
        }
        if (user.userId().equals(entity.getCheckerId())) {
            throw new SoDViolationException(
                    "Người phê duyệt không được là người kiểm soát. checkerId=" + entity.getCheckerId());
        }

        Long versionBefore = entity.getVersion();

        // 4-5. Update status and approver fields
        entity.setStatus("APPROVED");
        entity.setApproverId(user.userId());
        entity.setApproverActionAt(Instant.now());
        entity.setApproverComment(req != null ? req.comment() : null);
        entity.setUpdatedBy(user.userId());
        entity.setUpdatedAt(Instant.now());
        entity.setUpdatedIp(ip);

        // 6. Save
        PayOrderEntity saved = payOrderRepository.save(entity);

        // 7. Audit
        auditHashChainService.record(
                "PAY_ORDER", id, "APPROVE",
                user.userId(), ip,
                versionBefore, saved.getVersion(),
                toJson(Map.of("oldStatus", "PENDING_APPROVER", "newStatus", "APPROVED")));

        // 8. Log notification to Maker
        log.info("[NOTIFY] Maker={} — lệnh order={} đã được phê duyệt bởi approver={}",
                entity.getCreatedBy(), id, user.userId());

        // 9. Return result
        return Map.of(
                "id", id,
                "status", "APPROVED",
                "version", saved.getVersion(),
                "message", "MSG-OK-APPROVE: Lệnh thanh toán đã được phê duyệt thành công.");
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
