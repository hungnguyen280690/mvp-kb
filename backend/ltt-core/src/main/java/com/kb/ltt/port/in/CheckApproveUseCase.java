package com.kb.ltt.port.in;

/**
 * Use case: Checker phe duyet cap 1 (READY_FOR_APPROVAL → PENDING_APPROVER).
 * BDD: bdd-04-scenario-01.
 */
public interface CheckApproveUseCase {

    PayOrderResponse checkApprove(WorkflowCommand command);
}
