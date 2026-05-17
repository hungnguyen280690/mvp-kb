package com.kb.ltt.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Filter criteria for listing LTTs.
 * Maps to the search criteria from BA spec Section 2.1 (MOD.LIST filters).
 *
 * // FT-001: LTT list filter criteria
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttFilterRequest {

    private LttChannel channel;
    private String transactionType;
    private String lnhTransactionType;
    private String refNo;
    private String originNum;
    private LttStatus fStatus;
    private String senderCode;
    private String receiverCode;
    private String senderGlSegment2;
    private String receiverGlSegment2;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String dateField; // CREATED_DATE, PAYMENT_DATE, CHECKED_DATE, APPROVED_DATE
    private BigDecimal amountFrom;
    private BigDecimal amountTo;
    private String currencyCode;
    private String createdBy;
    private String checkedBy;
    private String approvedBy;
    private String glSegment3; // DVQHNS filter
}
