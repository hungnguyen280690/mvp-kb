package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * JPA Entity: LTT_PAY_ORDER_APPROVAL - Lich su workflow (append-only).
 * Tuong ung table LTT_PAY_ORDER_APPROVAL trong 03-schema.sql.
 */
@Entity
@Table(name = "LTT_PAY_ORDER_APPROVAL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOrderApprovalEntity {

    @Id
    @Column(name = "ID", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ORDER_ID", nullable = false, foreignKey = @ForeignKey(name = "FK_LTT_PAY_ORDER_APPROVAL_ORDER"))
    private PayOrderEntity order;

    @Column(name = "STEP_NO", nullable = false)
    private Integer stepNo;

    @Column(name = "ACTION", length = 30, nullable = false)
    private String action;

    @Column(name = "FROM_STATUS", length = 30)
    private String fromStatus;

    @Column(name = "TO_STATUS", length = 30, nullable = false)
    private String toStatus;

    @Column(name = "PERFORMED_BY", length = 36, nullable = false)
    private String performedBy;

    @Column(name = "PERFORMED_ROLE", length = 30, nullable = false)
    private String performedRole;

    @Column(name = "PERFORMED_AT", nullable = false)
    private OffsetDateTime performedAt;

    @Column(name = "PERFORMED_IP", length = 45)
    private String performedIp;

    @Column(name = "REASON", length = 500)
    private String reason;

    @Column(name = "VERSION_BEFORE")
    private Integer versionBefore;

    @Column(name = "VERSION_AFTER")
    private Integer versionAfter;
}
