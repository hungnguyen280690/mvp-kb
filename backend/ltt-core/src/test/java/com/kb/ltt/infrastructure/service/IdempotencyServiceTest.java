package com.kb.ltt.infrastructure.service;

import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.entity.IdempotencyStoreEntity;
import com.kb.ltt.infrastructure.persistence.repository.IdempotencyStoreRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for IdempotencyService using H2 in-memory DB.
 */
@DisplayName("IdempotencyService — integration")
class IdempotencyServiceTest extends BaseIntegrationTest {

    @Autowired
    IdempotencyService idempotencyService;

    @Autowired
    IdempotencyStoreRepository idempotencyStoreRepository;

    @Test
    @DisplayName("new key → PROCEED (shouldReplay=false)")
    void check_newKey_returnsProceed() {
        String key = UUID.randomUUID().toString();

        IdempotencyResult result = idempotencyService.check(key, "{\"amount\":1000}");

        assertThat(result.shouldReplay()).isFalse();
        assertThat(result.cachedStatusCode()).isNull();
        assertThat(result.cachedBody()).isNull();
    }

    @Test
    @DisplayName("same key + same body → shouldReplay=true with cached response")
    void check_sameKeyAndBody_returnsReplay() {
        String key = UUID.randomUUID().toString();
        String body = "{\"amount\":500}";

        // First call — proceed
        IdempotencyResult first = idempotencyService.check(key, body);
        assertThat(first.shouldReplay()).isFalse();

        // Simulate storing result after processing
        idempotencyService.store(key, body, 201, "{\"id\":\"abc123\"}");

        // Second call — should replay
        IdempotencyResult second = idempotencyService.check(key, body);

        assertThat(second.shouldReplay()).isTrue();
        assertThat(second.cachedStatusCode()).isEqualTo(201);
        assertThat(second.cachedBody()).isEqualTo("{\"id\":\"abc123\"}");
    }

    @Test
    @DisplayName("same key + different body → BusinessException MSG-ERR-IDEMPOTENCY")
    void check_sameKeyDifferentBody_throwsBusinessException() {
        String key = UUID.randomUUID().toString();

        idempotencyService.store(key, "{\"amount\":1000}", 201, "{\"id\":\"xyz\"}");

        assertThatThrownBy(() ->
                idempotencyService.check(key, "{\"amount\":9999}")
        )
        .isInstanceOf(BusinessException.class)
        .satisfies(ex -> assertThat(((BusinessException) ex).getCode())
                .isEqualTo("MSG-ERR-IDEMPOTENCY"));
    }

    @Test
    @DisplayName("expired entry → treated as new request (shouldReplay=false)")
    void check_expiredEntry_returnsProceed() {
        String key = UUID.randomUUID().toString();
        String body = "{\"amount\":2000}";
        String requestHash = computeHash(body);

        // Insert expired entry directly
        IdempotencyStoreEntity expired = IdempotencyStoreEntity.builder()
                .idempotencyKey(key)
                .requestHash(requestHash)
                .statusCode(201)
                .responseBody("{\"id\":\"old\"}")
                .createdAt(Instant.now().minusSeconds(90_000))
                .expiresAt(Instant.now().minusSeconds(1)) // already expired
                .build();
        idempotencyStoreRepository.save(expired);

        IdempotencyResult result = idempotencyService.check(key, body);

        assertThat(result.shouldReplay()).isFalse();
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private String computeHash(String body) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(body.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
