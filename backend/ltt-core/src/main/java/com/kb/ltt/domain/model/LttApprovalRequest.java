package com.kb.ltt.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for check (Checker) and approve (Approver) actions.
 *
 * // FT-001: LTT approval request for both Checker and Approver levels
 * // BIZ-006: Reason required when return/reject, >= 10 chars
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttApprovalRequest {

    // Optimistic lock version - must match current DB value
    private Integer fVer;

    // APPROVE, RETURN, or REJECT
    private ApprovalAction action;

    // BIZ-006: Required when action = RETURN or REJECT, >= 10 chars
    private String note;

    // Optional error code from business error catalog
    private String errorCode;

    /**
     * Possible approval actions for Checker and Approver.
     */
    public enum ApprovalAction {
        APPROVE,
        RETURN,
        REJECT
    }
}
