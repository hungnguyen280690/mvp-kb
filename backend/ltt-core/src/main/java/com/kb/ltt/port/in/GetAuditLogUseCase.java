package com.kb.ltt.port.in;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Use case: Lay lich su thao tac (audit log).
 */
public interface GetAuditLogUseCase {

    List<AuditLogEntry> getAuditLog(AuditLogQuery query);

    /**
     * Query parameters cho audit log.
     */
    record AuditLogQuery(
            String entityId,
            String entityType,
            int page,
            int size
    ) {}

    /**
     * Audit log entry response.
     */
    record AuditLogEntry(
            Long id,
            String entityType,
            String entityId,
            String action,
            String performedBy,
            OffsetDateTime performedAt,
            String ipAddress,
            String userAgent,
            String traceId,
            String oldValue,
            String newValue,
            Integer versionBefore,
            Integer versionAfter,
            String hash
    ) {}
}
