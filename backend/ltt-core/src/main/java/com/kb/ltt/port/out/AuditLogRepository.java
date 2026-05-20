package com.kb.ltt.port.out;

import com.kb.ltt.domain.PayOrderApproval;

import java.util.List;

/**
 * Outbound port: Repository cho Audit Log.
 */
public interface AuditLogRepository {

    /**
     * Save audit log entry.
     */
    void save(AuditLogEntry entry);

    /**
     * Find audit log entries by entity ID.
     */
    List<AuditLogEntry> findByEntityId(String entityType, String entityId);

    /**
     * Audit log entry record.
     */
    record AuditLogEntry(
            String entityType,
            String entityId,
            String action,
            String performedBy,
            java.time.OffsetDateTime performedAt,
            String ipAddress,
            String userAgent,
            String traceId,
            String oldValue,
            String newValue,
            Integer versionBefore,
            Integer versionAfter,
            String prevHash,
            String hash
    ) {}
}
