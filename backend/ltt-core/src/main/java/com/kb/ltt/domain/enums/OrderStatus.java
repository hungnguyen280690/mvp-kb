package com.kb.ltt.domain.enums;

/**
 * 7 trang thai MVP cua LTT_PAY_ORDER.F-STATUS.
 * Tuong ung CHECK constraint CK_LTT_PAY_ORDER_STATUS trong 03-schema.sql.
 */
public enum OrderStatus {

    DRAFT,
    READY_FOR_APPROVAL,
    PENDING_APPROVER,
    APPROVED,
    RETURNED_TO_MAKER,
    REJECTED,
    DELETED;

    /**
     * Kiem tra trang thai cho phep Maker chinh sua (UPDATE).
     * BDD: bdd-01-scenario-01 (DRAFT editable), bdd-03-scenario-02 (RETURNED editable).
     */
    public boolean isEditable() {
        return this == DRAFT || this == RETURNED_TO_MAKER;
    }

    /**
     * Kiem tra trang thai cho phep Maker submit.
     * BDD: bdd-02-scenario-01 (DRAFT submit), bdd-03-scenario-03 (RETURNED resubmit).
     */
    public boolean isSubmittable() {
        return this == DRAFT || this == RETURNED_TO_MAKER;
    }

    /**
     * Kiem tra trang thai cho phep soft-delete.
     * BDD: bdd-06-scenario-01.
     */
    public boolean isDeletable() {
        return this == DRAFT || this == RETURNED_TO_MAKER;
    }

    /**
     * Trang thai cuoi (khong co transition di chuyen tiep trong MVP).
     */
    public boolean isFinal() {
        return this == APPROVED || this == REJECTED || this == DELETED;
    }
}
