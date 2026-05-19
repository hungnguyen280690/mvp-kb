package com.kb.ltt.interfaces.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Attachment response DTO matching openapi.yaml AttachmentResponse schema.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {

    private String id;
    private String orderId;
    private String fileName;
    private String docType;
    private String note;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private String fileHash;
    private String uploadedBy;
    private OffsetDateTime uploadedAt;
    private Boolean isDeleted;
}
