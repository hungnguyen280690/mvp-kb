package com.kb.ltt.domain.model;

/**
 * Enum representing the payment channel for an LTT.
 *
 * LNH  - Lien Ngan Hang (Inter-bank Channel via NHNN)
 * TTSP - Thanh Toan Song Phuong (Bilateral Payment)
 *
 * // FT-001: Channel type for LTT
 */
public enum LttChannel {

    LNH("LNH", "Kênh Liên Ngân Hàng"),
    TTSP("TTSP", "Thanh toán Song phương");

    private final String code;
    private final String description;

    LttChannel(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }
}
