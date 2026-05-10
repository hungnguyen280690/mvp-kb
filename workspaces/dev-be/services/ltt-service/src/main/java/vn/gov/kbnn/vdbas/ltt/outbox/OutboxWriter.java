package vn.gov.kbnn.vdbas.ltt.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.gov.kbnn.vdbas.ltt.domain.dto.LttEvent;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Outbox;
import vn.gov.kbnn.vdbas.ltt.domain.enums.EventType;
import vn.gov.kbnn.vdbas.ltt.repository.OutboxRepository;

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

    private final OutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

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
        try {
            LttEvent eventPayload = LttEvent.builder()
                    .lttId(ltt.getId())
                    .soYctt(ltt.getSoYctt())
                    .state(ltt.getState())
                    .amount(ltt.getAmount())
                    .currency(ltt.getCurrency())
                    .paymentDate(ltt.getPaymentDate())
                    .channel(ltt.getChannel())
                    .eventType(eventType.name())
                    .eventTimestamp(OffsetDateTime.now())
                    .userId(userId)
                    .userRole(userRole)
                    .reason(reason)
                    .build();

            String payload = objectMapper.writeValueAsString(eventPayload);

            Outbox outbox = Outbox.builder()
                    .aggregateType("LTT")
                    .aggregateId(ltt.getId())
                    .eventType(eventType.name())
                    .payload(payload)
                    .createdBy(userId)
                    .build();

            outboxRepository.save(outbox);

            log.info("Outbox write successful: eventType={}, lttId={}, soYctt={}, userId={}",
                    eventType.getTopic(), ltt.getId(), ltt.getSoYctt(), userId);

        } catch (Exception e) {
            log.error("Failed to write event to outbox for lttId={}", ltt.getId(), e);
            // Re-throw as a runtime exception to ensure transaction rollback
            throw new RuntimeException("Failed to write event to outbox", e);
        }
    }
}
