package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.AuditLogEntry;
import com.kb.ltt.application.dto.PagedResponse;
import com.kb.ltt.infrastructure.persistence.entity.AuditLogEntity;
import com.kb.ltt.infrastructure.persistence.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Queries the audit log for a specific PayOrder.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuditLogQueryUseCase {

    private final AuditLogRepository auditLogRepository;

    /**
     * Returns paginated audit log entries for the given order ID,
     * ordered chronologically (oldest first).
     *
     * @param orderId entity ID of the PayOrder
     * @param page    zero-based page index
     * @param size    page size
     * @return paged audit log entries
     */
    public PagedResponse<AuditLogEntry> getAuditLog(String orderId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "performedAt"));

        List<AuditLogEntity> entries = auditLogRepository
                .findByEntityIdOrderByPerformedAt(orderId, pageable);

        long total = auditLogRepository.countByEntityId(orderId);

        List<AuditLogEntry> content = entries.stream()
                .map(this::toDto)
                .toList();

        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;

        return PagedResponse.<AuditLogEntry>builder()
                .content(content)
                .totalElements(total)
                .totalPages(totalPages)
                .page(page)
                .size(size)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private AuditLogEntry toDto(AuditLogEntity e) {
        return AuditLogEntry.builder()
                .id(e.getId())
                .entityType(e.getEntityType())
                .entityId(e.getEntityId())
                .action(e.getAction())
                .performedBy(e.getPerformedBy())
                .performedAt(e.getPerformedAt())
                .ipAddress(e.getIpAddress())
                .versionBefore(e.getVersionBefore())
                .versionAfter(e.getVersionAfter())
                .payload(e.getPayload())
                .build();
    }
}
