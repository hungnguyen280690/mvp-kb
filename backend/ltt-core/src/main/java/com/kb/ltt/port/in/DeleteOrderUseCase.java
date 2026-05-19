package com.kb.ltt.port.in;

/**
 * Use case: Soft-delete lenh thanh toan.
 * BDD: bdd-06-scenario-01.
 */
public interface DeleteOrderUseCase {

    void delete(DeleteOrderCommand command);

    /**
     * Command record cho delete order.
     */
    record DeleteOrderCommand(
            String id,
            long expectedVersion,
            String deleteReason,
            boolean confirmed,
            String userId,
            String userIp
    ) {}
}
