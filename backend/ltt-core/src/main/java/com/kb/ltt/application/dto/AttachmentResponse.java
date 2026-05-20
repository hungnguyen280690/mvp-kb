package com.kb.ltt.application.dto;

import lombok.*;

import java.time.Instant;

/**
 * Response DTO for attachment operations.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {

    private String id;
    private String orderId;
    private String fileName;
    private String contentType;
    private long fileSizeBytes;
    private String sha256;
    private String uploadedBy;
    private Instant uploadedAt;
    private Boolean isDeleted;
}
