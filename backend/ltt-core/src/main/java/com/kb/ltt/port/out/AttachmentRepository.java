package com.kb.ltt.port.out;

import com.kb.ltt.domain.PayOrderAttachment;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port: Repository cho PayOrderAttachment.
 */
public interface AttachmentRepository {

    /**
     * Save attachment.
     */
    PayOrderAttachment save(PayOrderAttachment attachment);

    /**
     * Find attachment by ID.
     */
    Optional<PayOrderAttachment> findById(String attachmentId);

    /**
     * Find all attachments for an order (including soft-deleted).
     */
    List<PayOrderAttachment> findByOrderId(String orderId);

    /**
     * Find all active (non-deleted) attachments for an order.
     */
    List<PayOrderAttachment> findActiveByOrderId(String orderId);
}
