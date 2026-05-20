package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.AttachmentResponse;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderAttachmentEntity;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderAttachmentRepository;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import com.kb.ltt.infrastructure.service.AuditHashChainService;
import com.kb.ltt.infrastructure.service.IdempotencyResult;
import com.kb.ltt.infrastructure.service.IdempotencyService;
import com.kb.ltt.infrastructure.util.HashUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Manages file attachments for PayOrders.
 * Files are stored on the local filesystem under {@code app.storage.path}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentUseCase {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",   // docx
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"          // xlsx
    );

    @Value("${app.storage.path:./target/test-storage}")
    private String storagePath;

    private final PayOrderRepository payOrderRepository;
    private final PayOrderAttachmentRepository attachmentRepository;
    private final AuditHashChainService auditHashChainService;
    private final IdempotencyService idempotencyService;

    /**
     * Download result record.
     */
    public record AttachmentDownload(byte[] bytes, String contentType, String fileName) {}

    // ── Upload ────────────────────────────────────────────────────────────

    @Transactional
    public AttachmentResponse upload(String orderId,
                                     String fileName,
                                     String contentType,
                                     byte[] bytes,
                                     String description,
                                     UserContext user,
                                     String idempotencyKey) {
        // 1. Idempotency check
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            IdempotencyResult idem = idempotencyService.check(idempotencyKey, orderId + fileName);
            if (idem.shouldReplay()) {
                log.debug("Attachment upload idempotency replay for key={}", idempotencyKey);
                // Replay: return existing attachment by idempotency key is not directly supported;
                // return an empty placeholder to prevent duplicate write.
                // In practice the controller would use the stored response body.
                throw new BusinessException("MSG-ERR-IDEMPOTENCY",
                        "Idempotency-Key " + idempotencyKey + " already used.");
            }
        }

        // 2. Find order entity; check status
        PayOrderEntity order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("MSG-ERR-NOT-FOUND",
                        "PayOrder không tồn tại: " + orderId));

        String status = order.getStatus();
        if (!"DRAFT".equals(status) && !"RETURNED_TO_MAKER".equals(status)) {
            throw new BusinessException("MSG-ERR-INVALID-STATUS",
                    "Chỉ có thể đính kèm tệp khi lệnh ở trạng thái DRAFT hoặc RETURNED_TO_MAKER.");
        }

        // 3. Validate file size and content type
        if (bytes == null || bytes.length == 0) {
            throw new BusinessException("MSG-ERR-EMPTY-FILE", "Tệp đính kèm không được rỗng.");
        }
        if (bytes.length > MAX_FILE_SIZE) {
            throw new BusinessException("MSG-ERR-FILE-TOO-LARGE",
                    "Tệp đính kèm vượt quá kích thước tối đa 10MB.");
        }
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException("MSG-ERR-INVALID-FILE-TYPE",
                    "Loại tệp không được hỗ trợ. Chỉ chấp nhận: pdf, jpg, jpeg, png, docx, xlsx.");
        }

        // 4. Compute SHA-256 hash
        String sha256 = HashUtil.sha256(bytes);

        // 5. Generate attachment ID
        String attachmentId = UUID.randomUUID().toString();

        // 6. Build storage path: {storagePath}/ltt/{orderId}/{attachmentId}.{ext}
        String ext = extractExtension(fileName);
        Path filePath = Paths.get(storagePath, "ltt", orderId, attachmentId + "." + ext);

        // 7. Write bytes to filesystem
        try {
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, bytes);
            log.debug("Attachment saved to {}", filePath);
        } catch (IOException ex) {
            throw new BusinessException("MSG-ERR-STORAGE", "Lỗi lưu tệp đính kèm: " + ex.getMessage(), ex);
        }

        // 8. Save entity
        Instant now = Instant.now();
        PayOrderAttachmentEntity entity = PayOrderAttachmentEntity.builder()
                .id(attachmentId)
                .orderId(orderId)
                .fileName(fileName)
                .docType("ATTACHMENT")
                .note(description)
                .contentType(contentType)
                .fileSizeBytes((long) bytes.length)
                .sha256(sha256)
                .storagePath(filePath.toString())
                .uploadedBy(user.userId())
                .uploadedAt(now)
                .isDeleted(false)
                .build();

        attachmentRepository.save(entity);

        // 9. Audit
        auditHashChainService.record(
                "PAY_ORDER_ATTACHMENT", attachmentId, "ATTACHMENT_UPLOAD",
                user.userId(), user.ipAddress(),
                null, null,
                "{\"orderId\":\"" + orderId + "\",\"fileName\":\"" + fileName + "\"}");

        log.info("Attachment uploaded: id={} orderId={} by={}", attachmentId, orderId, user.userId());

        // 10. Store idempotency (simple: store attach id as response)
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.store(idempotencyKey, orderId + fileName, 201, attachmentId);
        }

        return toResponse(entity);
    }

    // ── List ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AttachmentResponse> list(String orderId) {
        return attachmentRepository.findByOrderIdAndIsDeletedFalse(orderId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Download ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AttachmentDownload download(String orderId, String attachId) {
        PayOrderAttachmentEntity entity = attachmentRepository.findById(attachId)
                .orElseThrow(() -> new BusinessException("MSG-ERR-NOT-FOUND",
                        "Tệp đính kèm không tồn tại: " + attachId));

        if (Boolean.TRUE.equals(entity.getIsDeleted())) {
            throw new BusinessException("MSG-ERR-NOT-FOUND", "Tệp đính kèm đã bị xóa: " + attachId);
        }

        if (!orderId.equals(entity.getOrderId())) {
            throw new BusinessException("MSG-ERR-NOT-FOUND",
                    "Tệp đính kèm không thuộc lệnh này.");
        }

        try {
            Path filePath = Paths.get(entity.getStoragePath());
            byte[] bytes = Files.readAllBytes(filePath);
            return new AttachmentDownload(bytes, entity.getContentType(), entity.getFileName());
        } catch (IOException ex) {
            throw new BusinessException("MSG-ERR-STORAGE", "Lỗi đọc tệp đính kèm: " + ex.getMessage(), ex);
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> delete(String attachId, String orderId, UserContext user, String idempotencyKey) {
        // 1. Find attachment, check orderId matches
        PayOrderAttachmentEntity entity = attachmentRepository.findById(attachId)
                .orElseThrow(() -> new BusinessException("MSG-ERR-NOT-FOUND",
                        "Tệp đính kèm không tồn tại: " + attachId));

        if (!orderId.equals(entity.getOrderId())) {
            throw new BusinessException("MSG-ERR-NOT-FOUND",
                    "Tệp đính kèm không thuộc lệnh này.");
        }

        // 2. Find order, check status
        PayOrderEntity order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("MSG-ERR-NOT-FOUND",
                        "PayOrder không tồn tại: " + orderId));

        String status = order.getStatus();
        if (!"DRAFT".equals(status) && !"RETURNED_TO_MAKER".equals(status)) {
            throw new BusinessException("MSG-ERR-INVALID-STATUS",
                    "Chỉ có thể xóa tệp đính kèm khi lệnh ở trạng thái DRAFT hoặc RETURNED_TO_MAKER.");
        }

        // 3. Check owner
        if (!order.getCreatedBy().equals(user.userId())) {
            throw new BusinessException("MSG-ERR-FORBIDDEN",
                    "Bạn không có quyền xóa tệp đính kèm của lệnh này.");
        }

        // 4. Soft-delete
        entity.setIsDeleted(true);
        entity.setDeletedBy(user.userId());
        entity.setDeletedAt(Instant.now());
        attachmentRepository.save(entity);

        // 5. Audit
        auditHashChainService.record(
                "PAY_ORDER_ATTACHMENT", attachId, "ATTACHMENT_DELETE",
                user.userId(), user.ipAddress(),
                null, null,
                "{\"orderId\":\"" + orderId + "\",\"attachId\":\"" + attachId + "\"}");

        log.info("Attachment soft-deleted: id={} orderId={} by={}", attachId, orderId, user.userId());

        return Map.of("id", attachId, "message", "Tệp đính kèm đã được xóa.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private AttachmentResponse toResponse(PayOrderAttachmentEntity e) {
        return AttachmentResponse.builder()
                .id(e.getId())
                .orderId(e.getOrderId())
                .fileName(e.getFileName())
                .contentType(e.getContentType())
                .fileSizeBytes(e.getFileSizeBytes() != null ? e.getFileSizeBytes() : 0L)
                .sha256(e.getSha256())
                .uploadedBy(e.getUploadedBy())
                .uploadedAt(e.getUploadedAt())
                .isDeleted(e.getIsDeleted())
                .build();
    }

    private String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "bin";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
