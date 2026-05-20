package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository cho PayOrderEntity.
 */
@Repository
public interface PayOrderJpaRepository extends JpaRepository<PayOrderEntity, String>,
        JpaSpecificationExecutor<PayOrderEntity> {

    Optional<PayOrderEntity> findByRefNo(String refNo);

    boolean existsByIdempotencyKey(String idempotencyKey);
}
