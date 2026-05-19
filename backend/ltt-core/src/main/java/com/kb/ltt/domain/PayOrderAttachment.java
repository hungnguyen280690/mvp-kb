package com.kb.ltt.domain;

import com.kb.ltt.domain.enums.DocType;
import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Value Object: File dinh kem cua LTT_PAY_ORDER.
 * Tuong ung bang LTT_PAY_ORDER_ATTACHMENT trong 03-schema.sql.
 */
@Getter
@Builder
@AllArgsConstructor
public class PayOrderAttachment {

    private String id;
    private String orderId;
    private String fileName;
    private DocType docType;
    private String note;
    private String filePath;       // Object storage path: /ltt/{orderId}/{attachmentId}.{ext}
    private long fileSize;         // bytes, check <= 10MB (10485760)
    private String contentType;    // MIME type
    private String fileHash;       // SHA-256 hash
    private String uploadedBy;
    private OffsetDateTime uploadedAt;
    private boolean deleted;       // Soft-delete flag
    private String deletedBy;
    private OffsetDateTime deletedAt;
}
