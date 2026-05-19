package com.kb.ltt.port.in;

/**
 * Use case: Tra lai lenh cho Maker (READY/PENDING → RETURNED_TO_MAKER).
 * BDD: bdd-04-scenario-02 (Checker return), bdd-04-scenario-04 (Approver return).
 */
public interface ReturnOrderUseCase {

    PayOrderResponse returnOrder(ReturnRejectCommand command);
}
