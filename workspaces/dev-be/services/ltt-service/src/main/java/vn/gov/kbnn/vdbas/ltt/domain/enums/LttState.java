package vn.gov.kbnn.vdbas.ltt.domain.enums;

/**
 * 15 trang thai LTT theo states.yaml.
 */
public enum LttState {
    DRAFT,
    SUBMITTED,
    IN_CONTROL,
    RETURNED_TO_MAKER,
    RETURNED_TO_CHECKER,
    APPROVED,
    SIGNED,
    SENT,
    SEND_FAILED,
    CONFIRMED,
    POSTED,
    POST_FAILED,
    CANCELLED,
    REVERSED,
    BLOCKED;

    /**
     * Trang thai cuoi cung — khong cho phep chuyen tiep.
     */
    public boolean isFinal() {
        return this == POSTED || this == CANCELLED || this == REVERSED;
    }
}
