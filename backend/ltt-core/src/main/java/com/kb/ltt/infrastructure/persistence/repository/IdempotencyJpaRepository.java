package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.IdempotencyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho IdempotencyEntity.
 */
@Repository
public interface IdempotencyJpaRepository extends JpaRepository<IdempotencyEntity, String> {

    Optional<IdempotencyEntity> findByIdempotencyKey(String idempotencyKey);

    void deleteByExpiresAtBefore(OffsetDateTime expiresAt);
}
