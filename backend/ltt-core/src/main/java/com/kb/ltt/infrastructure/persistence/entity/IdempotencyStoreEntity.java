package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * JPA entity mapping LTT_IDEMPOTENCY_STORE (ADR-0005).
 * Stores the result of a POST request keyed by Idempotency-Key header.
 * TTL 24h — entries with expiresAt < now() are eligible for cleanup.
 */
@Entity
@Table(name = "LTT_IDEMPOTENCY_STORE")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdempotencyStoreEntity {

    @Id
    @Column(name = "IDEMPOTENCY_KEY", length = 64)
    private String idempotencyKey;

    /** SHA-256 of the request body — used to detect key-reuse with different payload. */
    @Column(name = "REQUEST_HASH", length = 64, nullable = false)
    private String requestHash;

    @Column(name = "RESPONSE_STATUS")
    private Integer statusCode;

    @Lob
    @Column(name = "RESPONSE_BODY")
    private String responseBody;

    @Column(name = "CREATED_AT")
    private Instant createdAt;

    /** When this entry expires and can be cleaned up (TTL 24h). */
    @Column(name = "EXPIRES_AT", nullable = false)
    private Instant expiresAt;
}
