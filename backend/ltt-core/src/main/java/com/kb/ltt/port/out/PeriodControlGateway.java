package com.kb.ltt.port.out;

import java.time.LocalDate;

/**
 * Outbound port: Kiem tra ky ke tao (Period Control).
 * Validate PAYMENT_DATE trong ky OPEN.
 */
public interface PeriodControlGateway {

    /**
     * Kiem tra ky ke tao co dang open hay khong.
     *
     * @param kbnnId ma KBNN
     * @param date   ngay can kiem tra
     * @return true neu ky dang open
     */
    boolean isOpen(String kbnnId, LocalDate date);
}
