package com.kb.ltt.port.in;

import java.math.BigDecimal;

/**
 * Response DTO cho PayOrderLine.
 */
public record PayOrderLineResponse(
        String id,
        int lineNo,
        String glSegment1,
        String glSegment2,
        String glSegment3,
        String glSegment4,
        String glSegment5,
        String glSegment6,
        String glSegment7,
        String glSegment8,
        String glSegment9,
        String glSegment10,
        String glSegment11,
        String glSegment12,
        String ccidKey,
        String lineDescription,
        BigDecimal lineAmount
) {}
