package com.kb.ltt.interfaces.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Approval status response DTO matching openapi.yaml ApprovalStatusResponse schema.
 * Used for the workflow stepper (Maker -> Checker -> Approver timeline).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalStatusResponse {

    private String orderId;
    private String currentStatus;
    private List<ApprovalStep> steps;

    /**
     * Single approval step matching openapi.yaml ApprovalStep schema.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalStep {
        private Integer stepNo;
        private String action;
        private String fromStatus;
        private String toStatus;
        private String performedBy;
        private String performedRole;
        private OffsetDateTime performedAt;
        private String performedIp;
        private String reason;
        private Integer versionBefore;
        private Integer versionAfter;
    }
}
