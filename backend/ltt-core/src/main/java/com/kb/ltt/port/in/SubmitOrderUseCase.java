package com.kb.ltt.port.in;

/**
 * Use case: Submit lenh thanh toan (DRAFT/RETURNED → READY_FOR_APPROVAL).
 * BDD: bdd-02-scenario-01 (DRAFT submit), bdd-03-scenario-03 (RETURNED resubmit).
 */
public interface SubmitOrderUseCase {

    PayOrderResponse submit(SubmitCommand command);

    /**
     * Command record cho submit.
     */
    record SubmitCommand(
            String id,
            long expectedVersion,
            String userId,
            String userIp
    ) {}
}
