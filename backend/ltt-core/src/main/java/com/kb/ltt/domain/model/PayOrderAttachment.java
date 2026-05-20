package com.kb.ltt.domain.model;

import lombok.Builder;
import lombok.Getter;
import lombok.With;

import java.time.Instant;

/**
 * A file attachment associated with a PayOrder.
 * Pure Java — no JPA / Spring annotations.
 */
@Getter
@Builder(toBuilder = true)
@With
public class PayOrderAttachment {

    private final String id;
    private final String orderId;
    private final String fileName;
    private final String contentType;
    private final long fileSizeBytes;
    private final String sha256;
    private final String storagePath;
    private final String uploadedBy;
    private final Instant uploadedAt;
    private final boolean isDeleted;
}
