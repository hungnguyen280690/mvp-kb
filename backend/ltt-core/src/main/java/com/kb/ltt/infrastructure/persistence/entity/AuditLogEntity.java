package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * JPA Entity: LTT_AUDIT_LOG - Audit hash chain (append-only, ADR-0003).
 * Tuong ung table LTT_AUDIT_LOG trong 03-schema.sql.
 */
@Entity
@Table(name = "LTT_AUDIT_LOG")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogEntity {

    @Id
    @Column(name = "ID", nullable = false)
    private Long id;

    @Column(name = "ENTITY_TYPE", length = 50, nullable = false)
    private String entityType;

    @Column(name = "ENTITY_ID", length = 36, nullable = false)
    private String entityId;

    @Column(name = "ACTION", length = 30, nullable = false)
    private String action;

    @Column(name = "PERFORMED_BY", length = 36, nullable = false)
    private String performedBy;

    @Column(name = "PERFORMED_AT", nullable = false)
    private OffsetDateTime performedAt;

    @Column(name = "IP_ADDRESS", length = 45)
    private String ipAddress;

    @Column(name = "USER_AGENT", length = 500)
    private String userAgent;

    @Column(name = "TRACE_ID", length = 64)
    private String traceId;

    @Lob
    @Column(name = "OLD_VALUE")
    private String oldValue;

    @Lob
    @Column(name = "NEW_VALUE")
    private String newValue;

    @Column(name = "VERSION_BEFORE")
    private Integer versionBefore;

    @Column(name = "VERSION_AFTER")
    private Integer versionAfter;

    @Column(name = "PREV_HASH", length = 64)
    private String prevHash;

    @Column(name = "HASH", length = 64, nullable = false)
    private String hash;

    @Column(name = "GENERATED_BY", length = 20)
    @Builder.Default
    private String generatedBy = "HUMAN";

    @Column(name = "IS_VERIFIED", nullable = false)
    @Builder.Default
    private Integer isVerified = 0;
}
