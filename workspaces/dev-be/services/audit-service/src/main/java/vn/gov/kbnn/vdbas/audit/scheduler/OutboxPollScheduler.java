package vn.gov.kbnn.vdbas.audit.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.gov.kbnn.vdbas.audit.service.OutboxPublisher;

/**
 * Scheduled task — poll outbox table va publish events len MQ.
 * Chay moi 5 giay (configurable).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxPollScheduler {

    private final OutboxPublisher outboxPublisher;

    @Scheduled(fixedDelayString = "${vdbas.outbox.poll-interval-ms:5000}")
    public void pollAndPublish() {
        try {
            int published = outboxPublisher.publishPendingEvents();
            if (published > 0) {
                log.debug("Outbox poll: published {} events", published);
            }
        } catch (Exception e) {
            log.error("Outbox poll failed", e);
        }
    }
}
