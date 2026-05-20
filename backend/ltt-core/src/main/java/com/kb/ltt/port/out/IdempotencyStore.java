package com.kb.ltt.port.out;

import java.util.Optional;

/**
 * Outbound port: Idempotency store (ADR-0005).
 * TTL 24h.
 */
public interface IdempotencyStore {

    /**
     * Find stored response by idempotency key.
     */
    Optional<StoredResponse> findByKey(String idempotencyKey);

    /**
     * Store response for idempotency key.
     */
    void store(String idempotencyKey, StoredResponse response);

    /**
     * Stored response record.
     */
    record StoredResponse(
            String idempotencyKey,
            String requestHash,
            String endpoint,
            int responseStatus,
            String responseBody,
            String userId,
            java.time.OffsetDateTime createdAt,
            java.time.OffsetDateTime expiresAt
    ) {}
}
