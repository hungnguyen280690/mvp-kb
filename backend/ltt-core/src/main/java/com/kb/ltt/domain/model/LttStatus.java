package com.kb.ltt.domain.model;

/**
 * Enum representing the 9 states of an LTT (Lenh Thanh Toan) lifecycle.
 * Referenced by state machine transitions in LttServiceImpl.
 *
 * State transitions:
 *   DRAFT -> READY_FOR_APPROVAL (submit)
 *   DRAFT -> DELETED (delete)
 *   READY_FOR_APPROVAL -> PENDING_APPROVER (checker approve)
 *   READY_FOR_APPROVAL -> RETURNED_TO_MAKER (checker return)
 *   READY_FOR_APPROVAL -> REJECTED (checker reject)
 *   PENDING_APPROVER -> APPROVED (approver approve)
 *   PENDING_APPROVER -> RETURNED_TO_MAKER (approver return)
 *   PENDING_APPROVER -> REJECTED (approver reject)
 *   APPROVED -> TRANSFERRED_TO_GL (system transfer)
 *   TRANSFERRED_TO_GL -> POSTED (system post)
 *   RETURNED_TO_MAKER -> READY_FOR_APPROVAL (re-submit)
 *   RETURNED_TO_MAKER -> DELETED (delete)
 *
 * // FT-001: LTT State Machine (9 states)
 */
public enum LttStatus {

    DRAFT("Draft", "Bản nháp"),
    READY_FOR_APPROVAL("Ready_For_Approval", "Chờ kiểm soát"),
    PENDING_APPROVER("Pending_Approver", "Chờ phê duyệt"),
    APPROVED("Approved", "Đã phê duyệt"),
    TRANSFERRED_TO_GL("Transferred_to_GL", "Đã chuyển GL"),
    POSTED("Posted", "Đã ghi sổ"),
    RETURNED_TO_MAKER("Returned_To_Maker", "Trả lại người lập"),
    REJECTED("Rejected", "Từ chối"),
    DELETED("Deleted", "Đã xoá");

    private final String code;
    private final String description;

    LttStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }
}
