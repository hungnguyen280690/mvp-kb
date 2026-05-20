package com.kb.ltt.infrastructure.persistence.adapter;

import com.kb.ltt.domain.PayOrderAttachment;
import com.kb.ltt.domain.enums.DocType;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderAttachmentEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderAttachmentJpaRepository;
import com.kb.ltt.port.out.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AttachmentRepositoryAdapter implements AttachmentRepository {

    private final PayOrderAttachmentJpaRepository jpaRepo;

    @Override
    public PayOrderAttachment save(PayOrderAttachment attachment) {
        PayOrderAttachmentEntity entity = toEntity(attachment);
        return toDomain(jpaRepo.save(entity));
    }

    @Override
    public Optional<PayOrderAttachment> findById(String attachmentId) {
        return jpaRepo.findById(attachmentId).map(this::toDomain);
    }

    @Override
    public List<PayOrderAttachment> findByOrderId(String orderId) {
        return jpaRepo.findByOrderIdAndIsDeletedOrderByUploadedAtDesc(orderId, -1).stream()
                .map(this::toDomain).toList();
    }

    @Override
    public List<PayOrderAttachment> findActiveByOrderId(String orderId) {
        return jpaRepo.findByOrderIdAndIsDeletedOrderByUploadedAtDesc(orderId, 0).stream()
                .map(this::toDomain).toList();
    }

    private PayOrderAttachment toDomain(PayOrderAttachmentEntity e) {
        return PayOrderAttachment.builder()
                .id(e.getId())
                .orderId(e.getOrder() != null ? e.getOrder().getId() : null)
                .fileName(e.getFileName())
                .docType(e.getDocType() != null ? DocType.valueOf(e.getDocType()) : null)
                .note(e.getNote())
                .filePath(e.getFilePath())
                .fileSize(e.getFileSize())
                .contentType(e.getContentType())
                .fileHash(e.getFileHash())
                .uploadedBy(e.getUploadedBy())
                .uploadedAt(e.getUploadedAt())
                .deleted(e.getIsDeleted() != null && e.getIsDeleted() == 1)
                .deletedBy(e.getDeletedBy())
                .deletedAt(e.getDeletedAt())
                .build();
    }

    private PayOrderAttachmentEntity toEntity(PayOrderAttachment a) {
        PayOrderAttachmentEntity e = new PayOrderAttachmentEntity();
        e.setId(a.getId());
        e.setFileName(a.getFileName());
        e.setDocType(a.getDocType() != null ? a.getDocType().name() : null);
        e.setNote(a.getNote());
        e.setFilePath(a.getFilePath());
        e.setFileSize(a.getFileSize());
        e.setContentType(a.getContentType());
        e.setFileHash(a.getFileHash());
        e.setUploadedBy(a.getUploadedBy());
        e.setUploadedAt(a.getUploadedAt());
        e.setIsDeleted(a.isDeleted() ? 1 : 0);
        e.setDeletedBy(a.getDeletedBy());
        e.setDeletedAt(a.getDeletedAt());
        return e;
    }
}
