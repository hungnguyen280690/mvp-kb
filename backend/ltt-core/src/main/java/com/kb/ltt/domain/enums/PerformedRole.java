package com.kb.ltt.domain.enums;

/**
 * Vai tro thuc hien action - tuong ung CHECK CK_LTT_PAY_ORDER_APPROVAL_ROLE.
 * SoD (Segregation of Duties) yeu cau 3 role phai la 3 user khac nhau (BIZ-001).
 */
public enum PerformedRole {

    MAKER,
    CHECKER,
    APPROVER
}
