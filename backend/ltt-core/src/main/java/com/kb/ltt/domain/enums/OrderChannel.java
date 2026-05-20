package com.kb.ltt.domain.enums;

/**
 * Kenh giao dich - tuong ung CHECK CK_LTT_PAY_ORDER_CHANNEL.
 * LNH = Lien ngan hang, TTSP = Thanh toan song phuong, LIEN_KHO_BAC = Lien Kho Bac.
 */
public enum OrderChannel {

    LNH,
    TTSP,
    LIEN_KHO_BAC;

    /**
     * Kenh LNH co LNH_TRANSACTION_TYPE (LTT01..LTT04).
     */
    public boolean requiresLnhTransactionType() {
        return this == LNH;
    }

    /**
     * Kenh khac LIEN_KHO_BAC phai co ORDER_TYPE (INC-G-16).
     */
    public boolean requiresOrderType() {
        return this != LIEN_KHO_BAC;
    }
}
