package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * JPA Entity: LTT_IDEMPOTENCY_STORE - Idempotency-Key cache (ADR-0005).
 * Tuong ung table LTT_IDEMPOTENCY_STORE trong 03-schema.sql.
 */
@Entity
@Table(name = "LTT_IDEMPOTENCY_STORE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdempotencyEntity {

    @Id
    @Column(name = "IDEMPOTENCY_KEY", length = 64, nullable = false)
    private String idempotencyKey;

    @Column(name = "REQUEST_HASH", length = 64, nullable = false)
    private String requestHash;

    @Column(name = "ENDPOINT", length = 200, nullable = false)
    private String endpoint;

    @Column(name = "RESPONSE_STATUS", nullable = false)
    private Integer responseStatus;

    @Lob
    @Column(name = "RESPONSE_BODY")
    private String responseBody;

    @Column(name = "USER_ID", length = 36)
    private String userId;

    @Column(name = "CREATED_AT", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "EXPIRES_AT", nullable = false)
    private OffsetDateTime expiresAt;
}
