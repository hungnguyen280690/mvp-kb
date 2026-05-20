package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderAttachmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho PayOrderAttachmentEntity.
 */
@Repository
public interface PayOrderAttachmentJpaRepository extends JpaRepository<PayOrderAttachmentEntity, String> {

    List<PayOrderAttachmentEntity> findByOrderIdAndIsDeletedOrderByUploadedAtDesc(String orderId, Integer isDeleted);

    Optional<PayOrderAttachmentEntity> findByIdAndOrderId(String id, String orderId);
}
