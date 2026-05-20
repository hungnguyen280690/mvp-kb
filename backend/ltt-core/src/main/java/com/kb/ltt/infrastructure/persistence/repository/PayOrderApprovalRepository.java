package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderApprovalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayOrderApprovalRepository extends JpaRepository<PayOrderApprovalEntity, String> {

    List<PayOrderApprovalEntity> findByOrderIdOrderByActedAt(String orderId);

    int countByOrderId(String orderId);
}
