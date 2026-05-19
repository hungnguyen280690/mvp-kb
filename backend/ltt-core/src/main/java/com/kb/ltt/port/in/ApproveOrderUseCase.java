package com.kb.ltt.port.in;

/**
 * Use case: Approver phe duyet cuoi (PENDING_APPROVER → APPROVED).
 * BDD: bdd-04-scenario-03.
 */
public interface ApproveOrderUseCase {

    PayOrderResponse approve(WorkflowCommand command);
}
