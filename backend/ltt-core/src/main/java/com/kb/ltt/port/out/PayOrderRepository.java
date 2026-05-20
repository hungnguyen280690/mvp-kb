package com.kb.ltt.port.out;

import com.kb.ltt.domain.PayOrder;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port: Repository cho PayOrder aggregate root.
 * Hexagonal Architecture - port khong phu thuoc framework.
 */
public interface PayOrderRepository {

    /**
     * Save (insert or update) PayOrder aggregate.
     */
    PayOrder save(PayOrder payOrder);

    /**
     * Find PayOrder by ID, including lines and approvals.
     */
    Optional<PayOrder> findById(String id);

    /**
     * Find all with dynamic spec and pagination.
     */
    PayOrderPage findAll(PayOrderSpecification spec, int page, int size, String sortBy, String sortDirection);

    /**
     * Tim so sequence tiep theo cho REF_NO generation.
     * Atomic increment per (kbnnId, yearMonth) - INC-G-02.
     *
     * @param kbnnId   ma KBNN
     * @param yearMonth YYYYMM format
     * @return next sequence number
     */
    long findNextRefNoSeq(String kbnnId, String yearMonth);

    /**
     * Domain-level pagination response (khong phu thuoc Spring).
     */
    record PayOrderPage(
            List<PayOrder> content,
            long totalElements,
            int totalPages,
            int page,
            int size
    ) {}
}
