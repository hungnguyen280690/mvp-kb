package com.kb.ltt.infrastructure.persistence.adapter;

import com.kb.ltt.infrastructure.persistence.entity.IdempotencyEntity;
import com.kb.ltt.infrastructure.persistence.repository.IdempotencyJpaRepository;
import com.kb.ltt.port.out.IdempotencyStore;
import com.kb.ltt.port.out.IdempotencyStore.StoredResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * Adapter: Implements IdempotencyStore port using JPA infrastructure.
 * ADR-0005 - TTL 24h.
 */
@Component
@RequiredArgsConstructor
public class IdempotencyStoreAdapter implements IdempotencyStore {

    private final IdempotencyJpaRepository idempotencyJpaRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<StoredResponse> findByKey(String idempotencyKey) {
        return idempotencyJpaRepository.findByIdempotencyKey(idempotencyKey)
                .map(entity -> new StoredResponse(
                        entity.getIdempotencyKey(),
                        entity.getRequestHash(),
                        entity.getEndpoint(),
                        entity.getResponseStatus(),
                        entity.getResponseBody(),
                        entity.getUserId(),
                        entity.getCreatedAt(),
                        entity.getExpiresAt()
                ));
    }

    @Override
    @Transactional
    public void store(String idempotencyKey, StoredResponse response) {
        IdempotencyEntity entity = IdempotencyEntity.builder()
                .idempotencyKey(idempotencyKey)
                .requestHash(response.requestHash())
                .endpoint(response.endpoint())
                .responseStatus(response.responseStatus())
                .responseBody(response.responseBody())
                .userId(response.userId())
                .createdAt(response.createdAt() != null ? response.createdAt() : OffsetDateTime.now())
                .expiresAt(response.expiresAt() != null ? response.expiresAt() : OffsetDateTime.now().plusHours(24))
                .build();
        idempotencyJpaRepository.save(entity);
    }
}
