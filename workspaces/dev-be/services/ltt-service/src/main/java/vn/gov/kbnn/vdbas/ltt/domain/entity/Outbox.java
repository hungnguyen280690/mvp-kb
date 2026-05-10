package vn.gov.kbnn.vdbas.ltt.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "OUTBOX")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Outbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "AGGREGATE_TYPE", nullable = false, length = 50)
    private String aggregateType;

    @Column(name = "AGGREGATE_ID", nullable = false)
    private Long aggregateId;

    @Column(name = "EVENT_TYPE", nullable = false, length = 50)
    private String eventType;

    @Lob
    @Column(name = "PAYLOAD", nullable = false)
    private String payload;

    @Builder.Default
    @Column(name = "STATUS", nullable = false, length = 15)
    private String status = "PENDING";

    @Builder.Default
    @Column(name = "RETRY_COUNT", nullable = false)
    private Integer retryCount = 0;

    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "PUBLISHED_AT")
    private OffsetDateTime publishedAt;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;
}
