package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderAttachmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayOrderAttachmentRepository extends JpaRepository<PayOrderAttachmentEntity, String> {

    List<PayOrderAttachmentEntity> findByOrderIdAndIsDeletedFalse(String orderId);

    List<PayOrderAttachmentEntity> findByOrderId(String orderId);
}
