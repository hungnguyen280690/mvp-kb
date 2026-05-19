package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderApprovalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository cho PayOrderApprovalEntity.
 */
@Repository
public interface PayOrderApprovalJpaRepository extends JpaRepository<PayOrderApprovalEntity, String> {

    List<PayOrderApprovalEntity> findByOrderIdOrderByStepNoAsc(String orderId);
}
