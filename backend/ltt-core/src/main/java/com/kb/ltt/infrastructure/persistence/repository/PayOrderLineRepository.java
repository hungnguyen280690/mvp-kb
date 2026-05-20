package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderLineEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayOrderLineRepository extends JpaRepository<PayOrderLineEntity, String> {

    List<PayOrderLineEntity> findByOrderIdOrderByLineNum(String orderId);

    void deleteByOrderId(String orderId);
}
