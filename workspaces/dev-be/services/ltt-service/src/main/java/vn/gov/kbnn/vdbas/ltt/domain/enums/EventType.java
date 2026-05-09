package vn.gov.kbnn.vdbas.ltt.domain.enums;

/**
 * 22 event types tu events.yaml.
 * Dung cho event publishing va audit.
 */
public enum EventType {
    // CRUD
    CREATED("TT.OUT.MANUAL.CREATED"),
    DRAFT_SAVED("TT.OUT.MANUAL.DRAFT_SAVED"),
    DELETED("TT.OUT.MANUAL.DELETED"),
    EDITED("TT.OUT.MANUAL.EDITED"),

    // Workflow
    SUBMITTED("TT.OUT.MANUAL.SUBMITTED"),
    CHECK_APPROVED("TT.OUT.MANUAL.CHECK_APPROVED"),
    APPROVED("TT.OUT.MANUAL.APPROVED"),
    REJECTED("TT.OUT.MANUAL.REJECTED"),
    CANCELLED("TT.OUT.MANUAL.CANCELLED"),

    // Signing/Sending
    SIGNED("TT.OUT.MANUAL.SIGNED"),
    SENT("TT.OUT.MANUAL.SENT"),
    REVERSED("TT.OUT.MANUAL.REVERSED"),

    // Callback/Integration
    CONFIRMED("TT.OUT.MANUAL.CONFIRMED"),
    SEND_FAILED("TT.OUT.MANUAL.SEND_FAILED"),
    GL_POSTED("TT.OUT.MANUAL.GL_POSTED"),
    GL_FAILED("TT.OUT.MANUAL.GL_FAILED"),

    // System
    BLOCKED("TT.OUT.MANUAL.BLOCKED"),
    UNBLOCKED("TT.OUT.MANUAL.UNBLOCKED"),
    HOLD_PLACED("TT.OUT.MANUAL.HOLD_PLACED"),
    HOLD_RELEASED("TT.OUT.MANUAL.HOLD_RELEASED"),
    NOTIFICATION_SENT("TT.OUT.MANUAL.NOTIFICATION_SENT"),
    PRINT_REQUESTED("TT.OUT.MANUAL.PRINT_REQUESTED");

    private final String topic;

    EventType(String topic) {
        this.topic = topic;
    }

    public String getTopic() {
        return topic;
    }
}
