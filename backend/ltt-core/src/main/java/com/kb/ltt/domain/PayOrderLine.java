package com.kb.ltt.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Value Object: Chi tiet khoan muc COA (12 segments + amount).
 * Tuong ung bang LTT_PAY_ORDER_LINE trong 03-schema.sql.
 */
@Getter
@Builder
@AllArgsConstructor
public class PayOrderLine {

    private String id;
    private String orderId;
    private int lineNo;

    // 12 COA segments (LOV.07.1..12)
    private String glSegment1;   // Ma quy - default "01"
    private String glSegment2;   // TK tu nhien - bat buoc
    private String glSegment3;   // DVQHNS - bat buoc
    private String glSegment4;   // Cap NS (conditional)
    private String glSegment5;   // Chuong - default "000"
    private String glSegment6;   // Nganh KT - default "000"
    private String glSegment7;   // NDKT - default "0000"
    private String glSegment8;   // DB - default "00000"
    private String glSegment9;   // CTMT - default "00000"
    private String glSegment10;  // MN - default "00"
    private String glSegment11;  // Kho bac - default "0000"
    private String glSegment12;  // DP - default "000"

    private String ccidKey;           // Composite cache key cho COA Validator (ADR-0006)
    private String lineDescription;   // Dien giai dong (INC-A-14)
    private BigDecimal lineAmount;    // So tien dong - CHECK (LINE_AMOUNT > 0)

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
