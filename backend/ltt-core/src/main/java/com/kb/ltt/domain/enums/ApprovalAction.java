package com.kb.ltt.domain.enums;

/**
 * Cac hanh dong trong state machine workflow.
 * Tuong ung CHECK CK_LTT_PAY_ORDER_APPROVAL_ACTION trong LTT_PAY_ORDER_APPROVAL.
 */
public enum ApprovalAction {

    CREATE,
    UPDATE,
    SUBMIT,
    CHECK_APPROVE,
    APPROVE,
    RETURN_BY_CHECKER,
    REJECT_BY_CHECKER,
    RETURN_BY_APPROVER,
    REJECT_BY_APPROVER,
    DELETE
}
