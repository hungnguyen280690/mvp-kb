package com.kb.ltt.domain.port.outbound;

import java.util.Map;

/**
 * Outbound port for publishing audit events.
 * Used for recording all mutations on LTT records (BIZ-007, Rule 3.3).
 *
 * The infrastructure layer provides the actual implementation (e.g., logging,
 * outbox table, message queue).
 *
 * // BIZ-007: Audit log must record user, timestamp, IP, action, oldValue->newValue
 * // Rule 3.3: Audit trail recording for all mutations
 * // FT-001: Audit event publisher port
 */
public interface AuditEventPublisher {

    /**
     * Publish an audit event for an LTT mutation.
     *
     * @param eventType  the event identifier (e.g., LTT.NEW.SAVE, LTT.EDIT.SAVE)
     * @param lttId      the F_ID of the affected LTT
     * @param userId     the user performing the action
     * @param statusFrom the previous F_STATUS
     * @param statusTo   the new F_STATUS
     * @param note       optional note (e.g., reject/return reason)
     * @param diff       field-level changes (oldValue -> newValue)
     */
    void publishAuditEvent(String eventType,
                           Long lttId,
                           String userId,
                           String statusFrom,
                           String statusTo,
                           String note,
                           Map<String, String> diff);
}
