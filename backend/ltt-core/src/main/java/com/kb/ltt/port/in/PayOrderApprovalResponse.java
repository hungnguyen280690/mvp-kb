package com.kb.ltt.port.in;

import com.kb.ltt.domain.enums.OrderStatus;

import java.time.OffsetDateTime;

/**
 * Response DTO cho PayOrderApproval.
 */
public record PayOrderApprovalResponse(
        String id,
        int stepNo,
        String action,
        OrderStatus fromStatus,
        OrderStatus toStatus,
        String performedBy,
        String performedRole,
        OffsetDateTime performedAt,
        String reason,
        Integer versionBefore,
        Integer versionAfter
) {}
