package com.kb.ltt.application.dto;

import java.time.Instant;
import java.util.List;

/**
 * Response showing the 3-step approval workflow status for a PayOrder.
 */
public record ApprovalStatusResponse(
        String orderId,
        String status,
        List<ApprovalStep> steps,
        String currentStep
) {

    /**
     * Represents a single step in the approval chain.
     */
    public record ApprovalStep(
            String step,
            String userId,
            String userName,
            Instant actionAt,
            String action,
            String comment,
            boolean isCompleted
    ) {}
}
