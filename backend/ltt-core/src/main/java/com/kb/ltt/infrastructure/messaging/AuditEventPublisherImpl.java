package com.kb.ltt.infrastructure.messaging;

import com.kb.ltt.domain.port.outbound.AuditEventPublisher;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Simple logging implementation of AuditEventPublisher for the MVP phase.
 * In production, this will be replaced with an Outbox Pattern implementation
 * that publishes events to the audit-service via message queue.
 *
 * // BIZ-007: Audit trail recording for all mutations
 * // Rule 3.3: Audit trail via this publisher
 * // FT-001: Audit event publisher (logging implementation)
 */
@Component
@Slf4j
public class AuditEventPublisherImpl implements AuditEventPublisher {

    /**
     * Publishes an audit event by logging it.
     * Future: insert into OUTBOX table within same transaction,
     * then outbox processor will forward to audit-service.
     *
     * @param eventType  event identifier (e.g., LTT.NEW.SAVE)
     * @param lttId      the F_ID of the affected LTT
     * @param userId     the user performing the action
     * @param statusFrom previous status
     * @param statusTo   new status
     * @param note       optional note
     * @param diff       field-level changes
     */
    @Override
    public void publishAuditEvent(String eventType,
                                  Long lttId,
                                  String userId,
                                  String statusFrom,
                                  String statusTo,
                                  String note,
                                  Map<String, String> diff) {
        log.info("BIZ-007 AUDIT | type={} | lttId={} | user={} | statusFrom={} | statusTo={} | "
                        + "note={} | timestamp={} | diff={}",
                eventType, lttId, userId, statusFrom, statusTo, note,
                LocalDateTime.now(), diff);

        // <<MISSING-INFO: Outbox table schema and message queue configuration pending>>
        // TODO: Implement Outbox Pattern for production:
        // 1. Insert into LTT_AUDIT_OUTBOX table within same transaction
        // 2. Outbox processor polls and publishes to audit-service
        // 3. Include Hash Chain: prevHash + payload -> currentHash
    }
}
