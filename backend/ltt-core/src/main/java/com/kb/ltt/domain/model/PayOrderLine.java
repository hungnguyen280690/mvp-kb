package com.kb.ltt.domain.model;

import lombok.Builder;
import lombok.Getter;
import lombok.With;

import java.math.BigDecimal;

/**
 * A single accounting line attached to a PayOrder.
 * Pure Java — no JPA / Spring annotations.
 */
@Getter
@Builder(toBuilder = true)
@With
public class PayOrderLine {

    private final String id;
    private final String orderId;
    private final int lineNum;
    private final BigDecimal lineAmount;
    private final String lineDescription;

    // COA segments (Chart of Accounts)
    private final String ccidSegment1;
    private final String ccidSegment2;
    private final String ccidSegment3;
    private final String ccidSegment4;
    private final String ccidSegment5;
    private final String ccidSegment6;
    private final String ccidSegment7;
    private final String ccidSegment8;
    private final String ccidSegment9;
    private final String ccidSegment10;
    private final String ccidSegment11;
    private final String ccidSegment12;
}
