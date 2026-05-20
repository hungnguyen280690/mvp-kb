package com.kb.ltt.port.in;

import com.kb.ltt.domain.enums.DocType;

import java.io.InputStream;
import java.util.List;

/**
 * Use case: Quan ly file dinh kem (upload/download/delete/list).
 * BDD: bdd-01-scenario-01 (attachment in DRAFT/RETURNED).
 */
public interface ManageAttachmentUseCase {

    /**
     * Upload file dinh kem.
     * Chi cho phep khi status = DRAFT hoac RETURNED_TO_MAKER.
     */
    PayOrderAttachmentResponse upload(UploadAttachmentCommand command);

    /**
     * Download file dinh kem.
     */
    DownloadAttachmentResponse download(String orderId, String attachmentId);

    /**
     * Soft-delete file dinh kem.
     * Chi cho phep khi status = DRAFT hoac RETURNED_TO_MAKER.
     */
    void delete(String orderId, String attachmentId, String userId, String userIp);

    /**
     * Danh sach file dinh kem cua order.
     */
    List<PayOrderAttachmentResponse> list(String orderId);

    /**
     * Command record cho upload.
     */
    record UploadAttachmentCommand(
            String orderId,
            String fileName,
            DocType docType,
            String note,
            String contentType,
            long fileSize,
            InputStream inputStream,
            String userId,
            String userIp,
            String idempotencyKey
    ) {}

    /**
     * Response record cho attachment.
     */
    record PayOrderAttachmentResponse(
            String id,
            String orderId,
            String fileName,
            String docType,
            String note,
            String filePath,
            long fileSize,
            String contentType,
            String fileHash,
            String uploadedBy,
            java.time.OffsetDateTime uploadedAt,
            boolean deleted
    ) {}

    /**
     * Response record cho download.
     */
    record DownloadAttachmentResponse(
            String fileName,
            String contentType,
            long fileSize,
            InputStream inputStream
    ) {}
}
