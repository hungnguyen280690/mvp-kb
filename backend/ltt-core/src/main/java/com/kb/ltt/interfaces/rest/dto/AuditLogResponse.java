package com.kb.ltt.interfaces.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Audit log response DTO matching openapi.yaml AuditLogListResponse schema.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private List<AuditLogEntry> content;
    private PayOrderListResponse.PaginationMeta page;

    /**
     * Single audit log entry matching openapi.yaml AuditLogEntry schema.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditLogEntry {
        private Long id;
        private String entityType;
        private String entityId;
        private String action;
        private String performedBy;
        private OffsetDateTime performedAt;
        private String ipAddress;
        private String userAgent;
        private String traceId;
        private String oldValue;
        private String newValue;
        private Integer versionBefore;
        private Integer versionAfter;
        private String prevHash;
        private String hash;
        private String generatedBy;
    }
}
