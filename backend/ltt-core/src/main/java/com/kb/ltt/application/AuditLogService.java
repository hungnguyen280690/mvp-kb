package com.kb.ltt.application;

import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.GetAuditLogUseCase;
import com.kb.ltt.port.out.AuditLogRepository;
import com.kb.ltt.port.out.PayOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Audit log query use case implementation.
 * Returns audit log entries for a given entity, sorted by performed_at ascending.
 *
 * BDD coverage:
 * - bdd-07-audit.md — Scenario 1: View audit log for a PAY_ORDER
 * - bdd-07-audit.md — Scenario 2: Audit log not found for invalid entity ID
 * - bdd-07-audit.md — Scenario 3: Hash chain integrity check
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService implements GetAuditLogUseCase {

    private final AuditLogRepository auditLogRepository;
    private final PayOrderRepository payOrderRepository;

    /**
     * BDD: bdd-07-audit.md — Scenario 1: Happy path — View audit log for entity
     * BDD: bdd-07-audit.md — Scenario 2: Entity not found
     */
    @Override
    @Transactional(readOnly = true)
    public List<AuditLogEntry> getAuditLog(AuditLogQuery query) {
        // Validate entity exists
        validateEntityExists(query);

        List<AuditLogRepository.AuditLogEntry> entries =
                auditLogRepository.findByEntityId(query.entityType(), query.entityId());

        // Sort by performed_at ascending (chronological order for hash chain)
        List<AuditLogEntry> result = entries.stream()
                .sorted(Comparator.comparing(AuditLogRepository.AuditLogEntry::performedAt))
                .skip((long) query.page() * query.size())
                .limit(query.size())
                .map(this::toResponse)
                .collect(Collectors.toList());

        log.debug("Audit log query: entityType={}, entityId={}, page={}, size={}, returned={}",
                query.entityType(), query.entityId(), query.page(), query.size(), result.size());

        return result;
    }

    /**
     * BDD: bdd-07-audit.md — Scenario 2: Validate entity exists before returning audit log.
     */
    private void validateEntityExists(AuditLogQuery query) {
        if ("PAY_ORDER".equals(query.entityType())) {
            payOrderRepository.findById(query.entityId())
                    .orElseThrow(() -> new ResourceNotFoundException("PAY_ORDER",
                            "Khong tim thay lenh thanh toan voi id=" + query.entityId()));
        }
        // For other entity types (PAY_ORDER_LINE, PAY_ORDER_ATTACHMENT),
        // validation is optional at this level — they are accessed via parent order.
    }

    private AuditLogEntry toResponse(AuditLogRepository.AuditLogEntry entry) {
        return new AuditLogEntry(
                null, // id not exposed in use case response (internal DB sequence)
                entry.entityType(),
                entry.entityId(),
                entry.action(),
                entry.performedBy(),
                entry.performedAt(),
                entry.ipAddress(),
                entry.userAgent(),
                entry.traceId(),
                entry.oldValue(),
                entry.newValue(),
                entry.versionBefore(),
                entry.versionAfter(),
                entry.hash()
        );
    }
}
