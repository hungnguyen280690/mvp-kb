package com.kb.ltt.port.in;

/**
 * Use case: Lay chi tiet lenh thanh toan theo ID.
 * Tra ve PayOrderResponse kem version cho ETag header.
 */
public interface GetOrderUseCase {

    /**
     * Get order by ID.
     *
     * @param id the order UUID
     * @return PayOrderResponse with full detail
     * @throws com.kb.ltt.domain.exception.ResourceNotFoundException if not found
     */
    PayOrderResponse getById(String id);
}
