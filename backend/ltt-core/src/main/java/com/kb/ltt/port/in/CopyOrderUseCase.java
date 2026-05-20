package com.kb.ltt.port.in;

/**
 * Use case: Tao ban sao tu lenh san co.
 * BDD: bdd-07-scenario-01.
 */
public interface CopyOrderUseCase {

    PayOrderResponse copy(CopyCommand command);

    /**
     * Command record cho copy order.
     */
    record CopyCommand(
            String sourceId,
            String userId,
            String userIp,
            String idempotencyKey
    ) {}
}
