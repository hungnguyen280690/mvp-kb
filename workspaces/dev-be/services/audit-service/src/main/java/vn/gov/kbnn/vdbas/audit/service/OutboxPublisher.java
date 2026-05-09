package vn.gov.kbnn.vdbas.audit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.gov.kbnn.vdbas.audit.domain.entity.OutboxEvent;
import vn.gov.kbnn.vdbas.audit.repository.OutboxRepository;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * OutboxPublisher — poll outbox table va publish len MQ.
 * Thuc hien theo lich (scheduled) hoac manual trigger.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxPublisher {

    private final OutboxRepository outboxRepository;
    private final JmsTemplate jmsTemplate;

    private static final String EVENT_QUEUE = "TT.OUT.MANUAL.EVENTS.Q";
    private static final int MAX_RETRY = 3;

    /**
     * Poll va publish tat ca pending events.
     *
     * @return so event da publish
     */
    @Transactional
    public int publishPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxRepository.findByStatusOrderByCreatedAtAsc("PENDING");

        int published = 0;
        for (OutboxEvent event : pendingEvents) {
            try {
                publishEvent(event);
                outboxRepository.markAsPublished(event.getId(), OffsetDateTime.now());
                published++;
                log.info("Published event: type={}, eventId={}", event.getEventType(), event.getEventId());
            } catch (Exception e) {
                log.error("Failed to publish event: eventId={}", event.getEventId(), e);
                if (event.getRetryCount() >= MAX_RETRY) {
                    // Mark as failed, push to DLQ
                    log.warn("Event {} exceeded max retry, marking as FAILED", event.getEventId());
                } else {
                    outboxRepository.incrementRetryCount(event.getId());
                }
            }
        }
        return published;
    }

    private void publishEvent(OutboxEvent event) {
        jmsTemplate.convertAndSend(EVENT_QUEUE, event.getPayload());
    }
}
