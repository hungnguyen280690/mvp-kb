package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.PayOrderAttachment;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.ManageAttachmentUseCase;
import com.kb.ltt.port.out.AttachmentRepository;
import com.kb.ltt.port.out.AuditLogRepository;
import com.kb.ltt.port.out.FileStorage;
import com.kb.ltt.port.out.PayOrderRepository;
import com.kb.ltt.port.out.IdempotencyStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Attachment management use case implementation.
 * Upload/download/soft-delete/list attachments for a PayOrder.
 * Only allowed when order status is DRAFT or RETURNED_TO_MAKER.
 *
 * BDD coverage:
 * - bdd-01-create.md — Scenario 1: Upload attachment in DRAFT
 * - bdd-01-create.md — Scenario 2: Upload rejected — invalid MIME type
 * - bdd-01-create.md — Scenario 3: Upload rejected — file too large
 * - bdd-03-return.md — Scenario 2: Upload attachment in RETURNED_TO_MAKER
 * - bdd-06-delete.md — Scenario 1: Soft-delete attachment
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService implements ManageAttachmentUseCase {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (BIZ-005)
    private static final int MAX_ATTACHMENTS_PER_ORDER = 10;    // App-level limit
    private static final long MAX_TOTAL_SIZE_PER_ORDER = 50 * 1024 * 1024L; // 50MB total

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
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

    /**
     * BDD: bdd-01-create.md — Scenario 1: Happy path — Upload attachment in DRAFT
     * BDD: bdd-01-create.md — Scenario 2: Upload rejected — invalid MIME type
     * BDD: bdd-01-create.md — Scenario 3: Upload rejected — file too large
     */
    @Override
    @Transactional
    public PayOrderAttachmentResponse upload(UploadAttachmentCommand command) {
        // Idempotency check
        if (command.idempotencyKey() != null) {
            var cached = idempotencyStore.findByKey(command.idempotencyKey());
            if (cached != null) {
                log.info("Idempotency hit for attachment upload key={}", command.idempotencyKey());
                return (PayOrderAttachmentResponse) cached;
            }
        }

        // Validate order exists and is in editable status
        PayOrder order = payOrderRepository.findById(command.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("PAY_ORDER",
                        "Khong tim thay lenh thanh toan voi id=" + command.orderId()));

        if (!order.getStatus().isEditable()) {
            throw new BusinessRuleException("MSG-ERR-STATUS",
                    "Khong the upload file dinh kem o trang thai " + order.getStatus()
                            + ". Chi cho phep khi DRAFT hoac RETURNED_TO_MAKER.");
        }

        // BDD: bdd-01-create.md — Scenario 3: File size validation
        if (command.fileSize() > MAX_FILE_SIZE) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-SIZE",
                    "Dung luong file vuot qua 10MB. File size=" + formatSize(command.fileSize()));
        }

        if (command.fileSize() <= 0) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-SIZE",
                    "File khong hop le (dung luong = 0).");
        }

        // BDD: bdd-01-create.md — Scenario 2: MIME type validation
        if (command.contentType() == null || !ALLOWED_MIME_TYPES.contains(command.contentType())) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-MIME",
                    "Loai file khong duoc ho tro: " + command.contentType()
                            + ". Cho phep: " + String.join(", ", ALLOWED_MIME_TYPES));
        }

        // Check total attachments count and total size
        List<PayOrderAttachment> existingAttachments = attachmentRepository.findActiveByOrderId(command.orderId());
        if (existingAttachments.size() >= MAX_ATTACHMENTS_PER_ORDER) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-COUNT",
                    "So luong file dinh kem toi da la " + MAX_ATTACHMENTS_PER_ORDER
                            + ". Hien tai co " + existingAttachments.size() + " file.");
        }

        long currentTotalSize = existingAttachments.stream()
                .mapToLong(PayOrderAttachment::getFileSize)
                .sum();
        if (currentTotalSize + command.fileSize() > MAX_TOTAL_SIZE_PER_ORDER) {
            throw new BusinessRuleException("MSG-ERR-ATTACH-TOTAL",
                    "Tong dung luong file dinh kem vuot qua 50MB. Hien tai: "
                            + formatSize(currentTotalSize) + ", them: " + formatSize(command.fileSize()));
        }

        // Generate ID and build storage path
        String attachmentId = UUID.randomUUID().toString();
        String extension = extractExtension(command.fileName());
        String storagePath = "/ltt/" + command.orderId() + "/" + attachmentId
                + (extension.isEmpty() ? "" : "." + extension);

        // Store file
        String fileHash = fileStorage.store(storagePath, command.inputStream(), command.contentType());
        OffsetDateTime now = OffsetDateTime.now();

        // Build domain object
        PayOrderAttachment attachment = PayOrderAttachment.builder()
                .id(attachmentId)
                .orderId(command.orderId())
                .fileName(command.fileName())
                .docType(command.docType())
                .note(command.note())
                .filePath(storagePath)
                .fileSize(command.fileSize())
                .contentType(command.contentType())
                .fileHash(fileHash)
                .uploadedBy(command.userId())
                .uploadedAt(now)
                .deleted(false)
                .build();

        // Persist
        PayOrderAttachment saved = attachmentRepository.save(attachment);

        // Audit log
        auditLogRepository.save(AuditLogRepository.AuditLogEntry.builder()
                .entityType("PAY_ORDER_ATTACHMENT")
                .entityId(saved.getId())
                .action("ATTACH_UPLOAD")
                .performedBy(command.userId())
                .performedAt(now)
                .ipAddress(command.userIp())
                .newValue(toSummaryJson(saved))
                .build());

        log.info("Attachment uploaded: id={}, orderId={}, fileName={}, size={}",
                saved.getId(), saved.getOrderId(), saved.getFileName(), saved.getFileSize());

        // Idempotency store
        PayOrderAttachmentResponse response = toResponse(saved);
        if (command.idempotencyKey() != null) {
            idempotencyStore.store(command.idempotencyKey(),
                    String.valueOf(saved.getId().hashCode()),
                    "POST /api/pay-out-manual/" + command.orderId() + "/attachments",
                    201, response);
        }

        return response;
    }

    /**
     * BDD: bdd-01-create.md — Download attachment (all roles can view).
     */
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
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getFileSize(),
                inputStream
        );
    }

    /**
     * BDD: bdd-06-delete.md — Scenario 1: Soft-delete attachment in DRAFT/RETURNED
     */
    @Override
    @Transactional
    public void delete(String orderId, String attachmentId, String userId, String userIp) {
        PayOrder order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("PAY_ORDER",
                        "Khong tim thay lenh thanh toan voi id=" + orderId));

        if (!order.getStatus().isEditable()) {
            throw new BusinessRuleException("MSG-ERR-STATUS",
                    "Khong the xoa file dinh kem o trang thai " + order.getStatus()
                            + ". Chi cho phep khi DRAFT hoac RETURNED_TO_MAKER.");
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

        // Soft-delete: mark domain object
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

        // Audit log
        auditLogRepository.save(AuditLogRepository.AuditLogEntry.builder()
                .entityType("PAY_ORDER_ATTACHMENT")
                .entityId(attachmentId)
                .action("ATTACH_DELETE")
                .performedBy(userId)
                .performedAt(now)
                .ipAddress(userIp)
                .oldValue(toSummaryJson(attachment))
                .build());

        log.info("Attachment soft-deleted: id={}, orderId={}, fileName={}, deletedBy={}",
                attachmentId, orderId, attachment.getFileName(), userId);
    }

    /**
     * BDD: bdd-01-create.md — List attachments for an order (all roles can view).
     */
    @Override
    @Transactional(readOnly = true)
    public List<PayOrderAttachmentResponse> list(String orderId) {
        // Verify order exists
        if (!payOrderRepository.findById(orderId).isPresent()) {
            throw new ResourceNotFoundException("PAY_ORDER",
                    "Khong tim thay lenh thanh toan voi id=" + orderId);
        }

        List<PayOrderAttachment> attachments = attachmentRepository.findActiveByOrderId(orderId);
        return attachments.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // --- Helper methods ---

    private PayOrderAttachmentResponse toResponse(PayOrderAttachment attachment) {
        return new PayOrderAttachmentResponse(
                attachment.getId(),
                attachment.getOrderId(),
                attachment.getFileName(),
                attachment.getDocType() != null ? attachment.getDocType().name() : null,
                attachment.getNote(),
                attachment.getFilePath(),
                attachment.getFileSize(),
                attachment.getContentType(),
                attachment.getFileHash(),
                attachment.getUploadedBy(),
                attachment.getUploadedAt(),
                attachment.isDeleted()
        );
    }

    private String toSummaryJson(PayOrderAttachment attachment) {
        return String.format("{\"id\":\"%s\",\"orderId\":\"%s\",\"fileName\":\"%s\",\"fileSize\":%d,\"fileHash\":\"%s\"}",
                attachment.getId(), attachment.getOrderId(), attachment.getFileName(),
                attachment.getFileSize(), attachment.getFileHash());
    }

    private String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + "B";
        if (bytes < 1024 * 1024) return String.format("%.1fKB", bytes / 1024.0);
        return String.format("%.1fMB", bytes / (1024.0 * 1024.0));
    }
}
