package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * JPA entity mapping LTT_PAY_ORDER_APPROVAL (append-only workflow history).
 * Each state-machine transition appends one row here.
 */
@Entity
@Table(name = "LTT_PAY_ORDER_APPROVAL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderApprovalEntity {

    @Id
    @Column(name = "ID", length = 36)
    private String id;

    @Column(name = "ORDER_ID", length = 36, nullable = false)
    private String orderId;

    /** Step number within the order workflow. */
    @Column(name = "STEP_NO")
    private Integer stepNo;

    /** Action taken: CREATE / UPDATE / SUBMIT / CHECK_APPROVE / APPROVE / RETURN_BY_CHECKER / etc. */
    @Column(name = "ACTION", length = 30, nullable = false)
    private String action;

    @Column(name = "FROM_STATUS", length = 30)
    private String fromStatus;

    @Column(name = "TO_STATUS", length = 30, nullable = false)
    private String toStatus;

    /** The user who performed this action. */
    @Column(name = "PERFORMED_BY", length = 36, nullable = false)
    private String actorId;

    /** Role of actor: MAKER / CHECKER / APPROVER */
    @Column(name = "PERFORMED_ROLE", length = 30, nullable = false)
    private String performedRole;

    @Column(name = "PERFORMED_AT")
    private Instant actedAt;

    @Column(name = "PERFORMED_IP", length = 45)
    private String performedIp;

    /** Comment / reason (required for return/reject, min 10 chars). */
    @Column(name = "REASON", length = 500)
    private String comment;

    @Column(name = "VERSION_BEFORE")
    private Long versionBefore;

    @Column(name = "VERSION_AFTER")
    private Long versionAfter;
}
