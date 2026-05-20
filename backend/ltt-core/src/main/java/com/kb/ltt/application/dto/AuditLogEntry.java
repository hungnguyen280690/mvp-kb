package com.kb.ltt.application.dto;

import lombok.*;

import java.time.Instant;

/**
 * DTO for a single audit log entry.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntry {

    private Long id;
    private String entityType;
    private String entityId;
    private String action;
    private String performedBy;
    private Instant performedAt;
    private String ipAddress;
    private Long versionBefore;
    private Long versionAfter;
    /** Raw JSON payload string (or parsed object at controller layer). */
    private String payload;
}
