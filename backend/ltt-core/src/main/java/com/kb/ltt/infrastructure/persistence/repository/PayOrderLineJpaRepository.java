package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderLineEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository cho PayOrderLineEntity.
 */
@Repository
public interface PayOrderLineJpaRepository extends JpaRepository<PayOrderLineEntity, String> {

    List<PayOrderLineEntity> findByOrderIdOrderByLineNoAsc(String orderId);

    void deleteByOrderId(String orderId);
}
