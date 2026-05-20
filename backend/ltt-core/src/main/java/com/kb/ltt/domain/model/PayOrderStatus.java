package com.kb.ltt.domain.model;

public enum PayOrderStatus {
    DRAFT,
    READY_FOR_APPROVAL,
    PENDING_APPROVER,
    APPROVED,
    RETURNED_TO_MAKER,
    REJECTED,
    DELETED
}
