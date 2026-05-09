package vn.gov.kbnn.vdbas.ltt.outbox;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.gov.kbnn.vdbas.ltt.domain.enums.EventType;

/**
 * EventPublisher — publish event len MQ thong qua outbox pattern.
 * Thuc te: poll outbox table va gui vao IBM MQ.
 */
@Slf4j
@Component
public class EventPublisher {

    /**
     * Publish event len MQ.
     * TODO: Trien khai voi IBM MQ JMS.
     */
    public void publish(String eventType, String payload, String correlationId) {
        log.info("Publish event: type={}, correlationId={}", eventType, correlationId);
        // MQ publish logic here
    }
}
