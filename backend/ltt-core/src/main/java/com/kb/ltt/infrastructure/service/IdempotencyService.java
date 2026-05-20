package com.kb.ltt.infrastructure.service;

import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.persistence.entity.IdempotencyStoreEntity;
import com.kb.ltt.infrastructure.persistence.repository.IdempotencyStoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Idempotency guard for POST endpoints (ADR-0005).
 *
 * <p>Protocol:
 * <ol>
 *   <li>Caller invokes {@link #check(String, String)} before executing business logic.</li>
 *   <li>If result.shouldReplay() → return cached response immediately.</li>
 *   <li>Otherwise execute, then call {@link #store(String, String, int, String)} to persist result.</li>
 * </ol>
 * </p>
 *
 * <p>TTL: 24 hours.</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class IdempotencyService {

    static final Duration TTL = Duration.ofHours(24);

    private final IdempotencyStoreRepository idempotencyStoreRepository;

    /**
     * Check whether this idempotency key has been seen before.
     *
     * @param idempotencyKey the Idempotency-Key header value (UUID v4)
     * @param requestBodyJson JSON string of the request body
     * @return {@link IdempotencyResult#PROCEED} if this is a new request,
     *         or a replay result if the key was seen before with the same body.
     * @throws BusinessException with code "MSG-ERR-IDEMPOTENCY" if the key exists
     *         but the request body differs (conflicting replay attempt).
     */
    @Transactional
    public IdempotencyResult check(String idempotencyKey, String requestBodyJson) {
        String requestHash = sha256Hex(requestBodyJson != null ? requestBodyJson : "");

        Optional<IdempotencyStoreEntity> existing =
                idempotencyStoreRepository.findById(idempotencyKey);

        if (existing.isEmpty()) {
            return IdempotencyResult.PROCEED;
        }

        IdempotencyStoreEntity stored = existing.get();

        // Entry expired — treat as new
        if (stored.getExpiresAt() != null && stored.getExpiresAt().isBefore(Instant.now())) {
            log.debug("Idempotency key {} expired — treating as new request", idempotencyKey);
            return IdempotencyResult.PROCEED;
        }

        // Same body → replay
        if (requestHash.equals(stored.getRequestHash())) {
            log.debug("Idempotency replay: key={}", idempotencyKey);
            return new IdempotencyResult(true, stored.getStatusCode(), stored.getResponseBody());
        }

        // Key exists but body differs → conflict
        throw new BusinessException(
                "MSG-ERR-IDEMPOTENCY",
                "Idempotency-Key " + idempotencyKey + " was already used with a different request body.");
    }

    /**
     * Persist the response for a completed request so future replays can be served.
     *
     * @param idempotencyKey   the key to store
     * @param requestBodyJson  original request body (used to compute hash)
     * @param statusCode       HTTP response status
     * @param responseBodyJson serialised response body
     */
    @Transactional
    public void store(String idempotencyKey,
                      String requestBodyJson,
                      int statusCode,
                      String responseBodyJson) {
        String requestHash = sha256Hex(requestBodyJson != null ? requestBodyJson : "");
        Instant now = Instant.now();

        IdempotencyStoreEntity entity = IdempotencyStoreEntity.builder()
                .idempotencyKey(idempotencyKey)
                .requestHash(requestHash)
                .statusCode(statusCode)
                .responseBody(responseBodyJson)
                .createdAt(now)
                .expiresAt(now.plus(TTL))
                .build();

        idempotencyStoreRepository.save(entity);
        log.debug("Idempotency stored: key={} status={}", idempotencyKey, statusCode);
    }

    // ── Internals ─────────────────────────────────────────────────────────

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
