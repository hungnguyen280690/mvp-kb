package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * JPA entity mapping LTT_AUDIT_LOG (append-only hash-chain audit log).
 * ADR-0003: each entry contains SHA-256 chain linking prev → current.
 */
@Entity
@Table(name = "LTT_AUDIT_LOG")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_ltt_audit_log")
    @SequenceGenerator(name = "seq_ltt_audit_log", sequenceName = "SEQ_LTT_AUDIT_LOG",
                       allocationSize = 1, initialValue = 1)
    @Column(name = "ID")
    private Long id;

    /** Entity type: PAY_ORDER, PAY_ORDER_LINE, PAY_ORDER_ATTACHMENT */
    @Column(name = "ENTITY_TYPE", length = 50, nullable = false)
    private String entityType;

    @Column(name = "ENTITY_ID", length = 36, nullable = false)
    private String entityId;

    /** Action: CREATE / UPDATE / DELETE / SUBMIT / APPROVE / REJECT / RETURN / ... */
    @Column(name = "ACTION", length = 30, nullable = false)
    private String action;

    /** JSON payload snapshot (old or new value, depending on action). */
    @Lob
    @Column(name = "NEW_VALUE")
    private String payload;

    @Column(name = "PERFORMED_BY", length = 36, nullable = false)
    private String performedBy;

    @Column(name = "PERFORMED_AT")
    private Instant performedAt;

    @Column(name = "IP_ADDRESS", length = 45)
    private String ipAddress;

    @Column(name = "VERSION_BEFORE")
    private Long versionBefore;

    @Column(name = "VERSION_AFTER")
    private Long versionAfter;

    /** SHA-256 hex of the immediately preceding entry for this entityId. */
    @Column(name = "PREV_HASH", length = 64)
    private String prevHash;

    /** SHA-256 hex of (prevHash + entityType + entityId + action + userId + ts + payload + ip). */
    @Column(name = "HASH", length = 64, nullable = false)
    private String hash;
}
