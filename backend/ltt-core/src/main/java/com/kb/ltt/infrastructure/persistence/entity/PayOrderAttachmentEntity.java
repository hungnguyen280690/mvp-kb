package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * JPA entity mapping LTT_PAY_ORDER_ATTACHMENT.
 */
@Entity
@Table(name = "LTT_PAY_ORDER_ATTACHMENT")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderAttachmentEntity {

    @Id
    @Column(name = "ID", length = 36)
    private String id;

    @Column(name = "ORDER_ID", length = 36, nullable = false, insertable = true, updatable = false)
    private String orderId;

    @Column(name = "FILE_NAME", length = 255, nullable = false)
    private String fileName;

    @Column(name = "DOC_TYPE", length = 30, nullable = false)
    private String docType;

    @Column(name = "NOTE", length = 250)
    private String note;

    @Column(name = "CONTENT_TYPE", length = 100, nullable = false)
    private String contentType;

    @Column(name = "FILE_SIZE")
    private Long fileSizeBytes;

    @Column(name = "FILE_HASH", length = 64, nullable = false)
    private String sha256;

    @Column(name = "FILE_PATH", length = 500, nullable = false)
    private String storagePath;

    @Column(name = "UPLOADED_BY", length = 36, nullable = false)
    private String uploadedBy;

    @Column(name = "UPLOADED_AT")
    private Instant uploadedAt;

    /**
     * 0 = active, 1 = soft-deleted.
     * Mapped as Boolean for convenience (0=false, 1=true).
     */
    @Column(name = "IS_DELETED", nullable = false)
    private Boolean isDeleted;

    @Column(name = "DELETED_BY", length = 36)
    private String deletedBy;

    @Column(name = "DELETED_AT")
    private Instant deletedAt;
}
