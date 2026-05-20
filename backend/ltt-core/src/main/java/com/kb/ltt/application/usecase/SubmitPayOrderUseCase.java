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
import com.kb.ltt.infrastructure.persistence.entity.PayOrderLineEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import com.kb.ltt.infrastructure.service.AuditHashChainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Submits a DRAFT or RETURNED_TO_MAKER PayOrder for approval.
 * Enforces VAL-01, VAL-05, VAL-06, VAL-07, SoD, and optimistic locking.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubmitPayOrderUseCase {

    private static final Set<String> SUBMITTABLE_STATUSES = Set.of("DRAFT", "RETURNED_TO_MAKER");

    private final PayOrderRepository payOrderRepository;
    private final AuditHashChainService auditHashChainService;
    private final ObjectMapper objectMapper;

    public record SubmitRequest(String comment) {}

    @Transactional
    public Map<String, Object> submit(String id,
                                      SubmitRequest req,
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
        if (!SUBMITTABLE_STATUSES.contains(entity.getStatus())) {
            throw new InvalidStatusTransitionException(
                    PayOrderStatus.valueOf(entity.getStatus()), "SUBMIT");
        }

        // 3. SoD: only the creator can submit
        if (!user.userId().equals(entity.getCreatedBy())) {
            throw new SoDViolationException(
                    "Only the creator may submit a PayOrder. createdBy=" + entity.getCreatedBy());
        }

        // 4. Run validations
        validateForSubmit(entity);

        Long versionBefore = entity.getVersion();
        String oldStatus = entity.getStatus();

        // 5-6. Update status and audit fields
        entity.setStatus("READY_FOR_APPROVAL");
        entity.setUpdatedBy(user.userId());
        entity.setUpdatedAt(Instant.now());
        entity.setUpdatedIp(ip);

        // 7. Save
        PayOrderEntity saved = payOrderRepository.save(entity);

        // 8. Audit
        auditHashChainService.record(
                "PAY_ORDER", id, "SUBMIT",
                user.userId(), ip,
                versionBefore, saved.getVersion(),
                toJson(Map.of("oldStatus", oldStatus, "newStatus", "READY_FOR_APPROVAL")));

        // 9. Log notification (placeholder — real notification service TBD)
        log.info("[NOTIFY] user={} submitted order={} — checker to review", "checker-placeholder", id);

        // 10. Return result
        return Map.of(
                "id", id,
                "status", "READY_FOR_APPROVAL",
                "version", saved.getVersion(),
                "message", "MSG-OK-SUBMIT: Đã gửi giao dịch để kiểm soát/phê duyệt.");
    }

    // ── Validation ────────────────────────────────────────────────────────

    private void validateForSubmit(PayOrderEntity entity) {
        List<String> errors = new ArrayList<>();

        // VAL-01: mandatory fields
        requireNonBlank(entity.getChannel(), "channel", errors);
        requireNonBlank(entity.getSender(), "sender", errors);
        requireNonBlank(entity.getReceiver(), "receiver", errors);
        requireNonNull(entity.getPaymentDate(), "paymentDate", errors);
        requireNonBlank(entity.getCurrencyCode(), "currencyCode", errors);
        requireNonBlank(entity.getDescription(), "description", errors);
        requireNonBlank(entity.getSenderName(), "senderName", errors);
        requireNonBlank(entity.getSenderAddress(), "senderAddress", errors);
        requireNonBlank(entity.getSenderGlSegment2(), "senderGlSegment2", errors);
        requireNonBlank(entity.getSenderBankCode(), "senderBankCode", errors);
        requireNonBlank(entity.getReceiverName(), "receiverName", errors);
        requireNonBlank(entity.getReceiverGlSegment2(), "receiverGlSegment2", errors);
        requireNonBlank(entity.getReceiverBankCode(), "receiverBankCode", errors);
        requireNonBlank(entity.getReceiverAccountName(), "receiverAccountName", errors);

        // VAL-05: lines must not be empty
        List<PayOrderLineEntity> lines = entity.getLines();
        if (lines == null || lines.isEmpty()) {
            errors.add("lines: danh sách dòng không được trống (VAL-05)");
        } else {
            // VAL-06: each line amount > 0
            for (int i = 0; i < lines.size(); i++) {
                PayOrderLineEntity line = lines.get(i);
                if (line.getLineAmount() == null || line.getLineAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    errors.add("lines[" + i + "].lineAmount: phải > 0 (VAL-06)");
                }
            }

            // VAL-07: sum of lines == entity.amount
            if (errors.stream().noneMatch(e -> e.contains("VAL-06"))) {
                BigDecimal sum = lines.stream()
                        .map(PayOrderLineEntity::getLineAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (entity.getAmount() == null || sum.compareTo(entity.getAmount()) != 0) {
                    errors.add("amount: tổng dòng " + sum + " ≠ amount " + entity.getAmount() + " (VAL-07)");
                }
            }
        }

        // VAL-08 (MOCK): paymentDate not null (period always OPEN in MVP) — already covered by VAL-01

        if (!errors.isEmpty()) {
            throw new BusinessException("MSG-ERR-VALIDATION",
                    "Dữ liệu không hợp lệ: " + String.join("; ", errors));
        }
    }

    private void requireNonBlank(String value, String field, List<String> errors) {
        if (value == null || value.isBlank()) {
            errors.add(field + ": bắt buộc (VAL-01)");
        }
    }

    private void requireNonNull(Object value, String field, List<String> errors) {
        if (value == null) {
            errors.add(field + ": bắt buộc (VAL-01)");
        }
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
