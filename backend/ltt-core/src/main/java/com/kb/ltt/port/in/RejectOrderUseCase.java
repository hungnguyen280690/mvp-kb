package com.kb.ltt.port.in;

/**
 * Use case: Tu choi lenh (READY/PENDING → REJECTED).
 * BDD: bdd-04-scenario-02 (Checker reject), bdd-04-scenario-04 (Approver reject).
 */
public interface RejectOrderUseCase {

    PayOrderResponse reject(ReturnRejectCommand command);
}
