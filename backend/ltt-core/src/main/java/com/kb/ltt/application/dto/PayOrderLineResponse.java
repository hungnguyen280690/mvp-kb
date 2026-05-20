package com.kb.ltt.application.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * Response DTO for a single PayOrder line.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderLineResponse {

    private String id;
    private Integer lineNum;
    private BigDecimal lineAmount;
    private String lineDescription;

    // 12 COA / GL segments
    private String ccidSegment1;
    private String ccidSegment2;
    private String ccidSegment3;
    private String ccidSegment4;
    private String ccidSegment5;
    private String ccidSegment6;
    private String ccidSegment7;
    private String ccidSegment8;
    private String ccidSegment9;
    private String ccidSegment10;
    private String ccidSegment11;
    private String ccidSegment12;

    /** Whether the CCID combination has been validated against COA master data. */
    private boolean ccidValid;
}
