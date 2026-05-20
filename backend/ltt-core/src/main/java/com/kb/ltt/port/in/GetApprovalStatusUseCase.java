package com.kb.ltt.port.in;

import java.util.List;

/**
 * Use case: Lay trang thai phe duyet (workflow stepper timeline).
 * Tra ve danh sach cac buoc Maker -> Checker -> Approver.
 */
public interface GetApprovalStatusUseCase {

    /**
     * Get approval status for an order.
     *
     * @param orderId the order UUID
     * @return ApprovalStatusResponse with current status and steps
     * @throws com.kb.ltt.domain.exception.ResourceNotFoundException if order not found
     */
    ApprovalStatusResponse getApprovalStatus(String orderId);

    /**
     * Response record cho approval status.
     */
    record ApprovalStatusResponse(
            String orderId,
            String currentStatus,
            List<ApprovalStep> steps
    ) {}

    /**
     * Single approval step.
     */
    record ApprovalStep(
            int stepNo,
            String action,
            String fromStatus,
            String toStatus,
            String performedBy,
            String performedRole,
            java.time.OffsetDateTime performedAt,
            String performedIp,
            String reason,
            Integer versionBefore,
            Integer versionAfter
    ) {}
}
