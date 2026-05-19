package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * JPA Entity: LTT_PAY_ORDER_ATTACHMENT - File dinh kem.
 * Tuong ung table LTT_PAY_ORDER_ATTACHMENT trong 03-schema.sql.
 */
@Entity
@Table(name = "LTT_PAY_ORDER_ATTACHMENT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOrderAttachmentEntity {

    @Id
    @Column(name = "ID", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ORDER_ID", nullable = false, foreignKey = @ForeignKey(name = "FK_LTT_PAY_ORDER_ATTACH_ORDER"))
    private PayOrderEntity order;

    @Column(name = "FILE_NAME", length = 255, nullable = false)
    private String fileName;

    @Column(name = "DOC_TYPE", length = 30, nullable = false)
    private String docType;

    @Column(name = "NOTE", length = 250)
    private String note;

    @Column(name = "FILE_PATH", length = 500, nullable = false)
    private String filePath;

    @Column(name = "FILE_SIZE", nullable = false)
    private Long fileSize;

    @Column(name = "CONTENT_TYPE", length = 100, nullable = false)
    private String contentType;

    @Column(name = "FILE_HASH", length = 64, nullable = false)
    private String fileHash;

    @Column(name = "UPLOADED_BY", length = 36, nullable = false)
    private String uploadedBy;

    @Column(name = "UPLOADED_AT", nullable = false)
    private OffsetDateTime uploadedAt;

    @Column(name = "IS_DELETED", nullable = false)
    @Builder.Default
    private Integer isDeleted = 0;

    @Column(name = "DELETED_BY", length = 36)
    private String deletedBy;

    @Column(name = "DELETED_AT")
    private OffsetDateTime deletedAt;
}
