package vn.gov.kbnn.vdbas.ltt.outbox;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;
import vn.gov.kbnn.vdbas.ltt.domain.enums.EventType;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * OutboxWriter — ghi event vao outbox table trong cung giao dich Oracle (ADR-0001).
 * Relay process se poll va push vao MQ sau.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxWriter {

    /**
     * Ghi event vao outbox table.
     * Duoc goi trong cung transaction voi business logic.
     *
     * @param ltt       entity LTT
     * @param eventType loai event
     * @param userId    nguoi thuc hien
     * @param userRole  vai tro
     * @param reason    ly do (reject/cancel)
     */
    @Transactional
    public void writeEvent(Ltt ltt, EventType eventType, String userId, String userRole, String reason) {
        // TODO: Ghi vao bang OUTBOX_EVENT thay vi chi log
        log.info("Outbox write: eventType={}, lttId={}, soYctt={}, userId={}",
                eventType.getTopic(), ltt.getId(), ltt.getSoYctt(), userId);
    }
}
