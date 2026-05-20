package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.PayOrderAttachment;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.ManageAttachmentUseCase;
import com.kb.ltt.port.out.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Attachment management: upload/download/soft-delete/list.
 * Only allowed when order status is DRAFT or RETURNED_TO_MAKER.
 * BDD: bdd-01-scenario-01 (upload), bdd-06-scenario-01 (delete).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService implements ManageAttachmentUseCase {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int MAX_ATTACHMENTS_PER_ORDER = 10;
    private static final long MAX_TOTAL_SIZE_PER_ORDER = 50 * 1024 * 1024L;

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg", "image/png", "image/gif",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/zip"
    );

    private final AttachmentRepository attachmentRepository;
    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final FileStorage fileStorage;
    private final IdempotencyStore idempotencyStore;

    @Override
    @Transactional
    public PayOrderAttachmentResponse upload(UploadAttachmentCommand cmd) {
        // Idempotency check
        if (cmd.idempotencyKey() != null) {
            var cached = idempotencyStore.findByKey(cmd.idempotencyKey());
            if (cached.isPresent()) {
                return null; // Simplified
            }
        }

        PayOrder order = payOrderRepository.findById(cmd.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("PAY_ORDER",
                        "Khong tim thay lenh thanh toan voi id=" + cmd.orderId()));

        if (!order.getStatus().isEditable()) {
            throw new BusinessRuleException("MSG-ERR-STATUS",
                    "Khong the upload file dinh kem o trang thai " + order.getStatus());
        }

        if (cmd.fileSize() > MAX_FILE_SIZE) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-SIZE",
                    "Dung luong file vuot qua 10MB.");
        }

        if (cmd.contentType() == null || !ALLOWED_MIME_TYPES.contains(cmd.contentType())) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-MIME",
                    "Loai file khong duoc ho tro: " + cmd.contentType());
        }

        List<PayOrderAttachment> existing = attachmentRepository.findActiveByOrderId(cmd.orderId());
        if (existing.size() >= MAX_ATTACHMENTS_PER_ORDER) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-COUNT",
                    "So luong file dinh kem toi da la " + MAX_ATTACHMENTS_PER_ORDER);
        }

        String attachmentId = UUID.randomUUID().toString();
        String extension = extractExtension(cmd.fileName());
        String storagePath = "/ltt/" + cmd.orderId() + "/" + attachmentId
                + (extension.isEmpty() ? "" : "." + extension);

        String fileHash = fileStorage.store(storagePath, cmd.inputStream(), cmd.contentType());
        OffsetDateTime now = OffsetDateTime.now();

        PayOrderAttachment attachment = PayOrderAttachment.builder()
                .id(attachmentId)
                .orderId(cmd.orderId())
                .fileName(cmd.fileName())
                .docType(cmd.docType())
                .note(cmd.note())
                .filePath(storagePath)
                .fileSize(cmd.fileSize())
                .contentType(cmd.contentType())
                .fileHash(fileHash)
                .uploadedBy(cmd.userId())
                .uploadedAt(now)
                .deleted(false)
                .build();

        PayOrderAttachment saved = attachmentRepository.save(attachment);

        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER_ATTACHMENT", saved.getId(), "ATTACH_UPLOAD", cmd.userId(),
                now, cmd.userIp(), null, null,
                null, "{\"fileName\":\"" + saved.getFileName() + "\",\"fileSize\":" + saved.getFileSize() + "}",
                null, null,
                null, null
        ));

        // Store idempotency
        if (cmd.idempotencyKey() != null) {
            idempotencyStore.store(cmd.idempotencyKey(), new IdempotencyStore.StoredResponse(
                    cmd.idempotencyKey(), null,
                    "POST /api/pay-out-manual/" + cmd.orderId() + "/attachments",
                    201, saved.getId(), cmd.userId(), now, now.plusHours(24)
            ));
        }

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DownloadAttachmentResponse download(String orderId, String attachmentId) {
        PayOrderAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("PAY_ORDER_ATTACHMENT",
                        "Khong tim thay file dinh kem voi id=" + attachmentId));

        if (!attachment.getOrderId().equals(orderId)) {
            throw new ResourceNotFoundException("PAY_ORDER_ATTACHMENT",
                    "File dinh kem " + attachmentId + " khong thuoc lenh " + orderId);
        }

        if (attachment.isDeleted()) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-DELETED",
                    "File dinh kem da bi xoa: " + attachment.getFileName());
        }

        InputStream inputStream = fileStorage.load(attachment.getFilePath());
        return new DownloadAttachmentResponse(
                attachment.getFileName(), attachment.getContentType(),
                attachment.getFileSize(), inputStream
        );
    }

    @Override
    @Transactional
    public void delete(String orderId, String attachmentId, String userId, String userIp) {
        PayOrder order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("PAY_ORDER",
                        "Khong tim thay lenh thanh toan voi id=" + orderId));

        if (!order.getStatus().isEditable()) {
            throw new BusinessRuleException("MSG-ERR-STATUS",
                    "Khong the xoa file dinh kem o trang thai " + order.getStatus());
        }

        PayOrderAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("PAY_ORDER_ATTACHMENT",
                        "Khong tim thay file dinh kem voi id=" + attachmentId));

        if (!attachment.getOrderId().equals(orderId)) {
            throw new ResourceNotFoundException("PAY_ORDER_ATTACHMENT",
                    "File dinh kem " + attachmentId + " khong thuoc lenh " + orderId);
        }

        if (attachment.isDeleted()) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-DELETED",
                    "File dinh kem da bi xoa truoc do: " + attachment.getFileName());
        }

        OffsetDateTime now = OffsetDateTime.now();

        PayOrderAttachment updated = PayOrderAttachment.builder()
                .id(attachment.getId())
                .orderId(attachment.getOrderId())
                .fileName(attachment.getFileName())
                .docType(attachment.getDocType())
                .note(attachment.getNote())
                .filePath(attachment.getFilePath())
                .fileSize(attachment.getFileSize())
                .contentType(attachment.getContentType())
                .fileHash(attachment.getFileHash())
                .uploadedBy(attachment.getUploadedBy())
                .uploadedAt(attachment.getUploadedAt())
                .deleted(true)
                .deletedBy(userId)
                .deletedAt(now)
                .build();

        attachmentRepository.save(updated);

        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER_ATTACHMENT", attachmentId, "ATTACH_DELETE", userId,
                now, userIp, null, null,
                null, null,
                null, null,
                null, null
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayOrderAttachmentResponse> list(String orderId) {
        if (!payOrderRepository.findById(orderId).isPresent()) {
            throw new ResourceNotFoundException("PAY_ORDER",
                    "Khong tim thay lenh thanh toan voi id=" + orderId);
        }
        return attachmentRepository.findActiveByOrderId(orderId).stream()
                .map(this::toResponse)
                .toList();
    }

    private PayOrderAttachmentResponse toResponse(PayOrderAttachment a) {
        return new PayOrderAttachmentResponse(
                a.getId(), a.getOrderId(), a.getFileName(),
                a.getDocType() != null ? a.getDocType().name() : null,
                a.getNote(), a.getFilePath(), a.getFileSize(),
                a.getContentType(), a.getFileHash(),
                a.getUploadedBy(), a.getUploadedAt(), a.isDeleted()
        );
    }

    private String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
