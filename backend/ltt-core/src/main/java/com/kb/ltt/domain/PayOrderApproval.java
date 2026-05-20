package com.kb.ltt.domain;

import com.kb.ltt.domain.enums.ApprovalAction;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.enums.PerformedRole;
import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Value Object: Lich su workflow action (append-only).
 * Tuong ung bang LTT_PAY_ORDER_APPROVAL trong 03-schema.sql.
 */
@Getter
@Builder
@AllArgsConstructor
public class PayOrderApproval {

    private String id;
    private String orderId;
    private int stepNo;
    private ApprovalAction action;
    private OrderStatus fromStatus;
    private OrderStatus toStatus;
    private String performedBy;
    private PerformedRole performedRole;
    private OffsetDateTime performedAt;
    private String performedIp;
    private String reason;          // Ly do return/reject (>= 10 ky tu)
    private Integer versionBefore;
    private Integer versionAfter;
}
