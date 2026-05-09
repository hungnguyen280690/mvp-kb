package vn.gov.kbnn.vdbas.audit.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * JPA entity cho bang OUTBOX_EVENT — outbox pattern (ADR-0001).
 * Ghi event vao DB trong cung giao dich Oracle, sau do poll va publish len MQ.
 */
@Entity
@Table(name = "OUTBOX_EVENT")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EVENT_ID", nullable = false, length = 36, unique = true)
    private String eventId;

    @Column(name = "EVENT_TYPE", nullable = false, length = 50)
    private String eventType;

    @Column(name = "AGGREGATE_ID", nullable = false)
    private Long aggregateId;

    @Column(name = "AGGREGATE_TYPE", nullable = false, length = 30)
    @Builder.Default
    private String aggregateType = "LTT";

    @Column(name = "PAYLOAD", nullable = false, columnDefinition = "CLOB")
    private String payload;

    @Column(name = "STATUS", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "RETRY_COUNT")
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "CREATED_AT", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "PUBLISHED_AT")
    private OffsetDateTime publishedAt;
}
