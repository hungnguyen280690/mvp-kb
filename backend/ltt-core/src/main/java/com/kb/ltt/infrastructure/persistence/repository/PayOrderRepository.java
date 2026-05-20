package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PayOrderRepository extends JpaRepository<PayOrderEntity, String> {

    /**
     * List active orders for a KBNN tenant, excluding the specified status.
     * Used for the "DELETED" exclusion on list views.
     */
    Page<PayOrderEntity> findByKbnnIdAndStatusNot(String kbnnId, String status, Pageable pageable);

    Optional<PayOrderEntity> findByIdempotencyKey(String idempotencyKey);
}
