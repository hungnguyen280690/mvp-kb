package com.kb.ltt.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a new LTT.
 * Maps to fields from the BA spec Tab 1.1 (General Info) + Tab 1.2 (Details)
 * + Tab 1.3 (Sender) + Tab 1.4 (Receiver).
 *
 * // FT-001: LTT create request payload
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttCreateRequest {

    // General Info (Tab 1.1)
    private LttChannel channel;
    private String transactionType;
    private String lnhTransactionType;
    private String senderCode;
    private String receiverCode;
    private String refNo;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private String currencyCode;
    private BigDecimal exchangeRate;
    private String originNum;
    private LocalDate transactionDate;
    private String expType;
    private String fnCode1;
    private String fnCode2;
    private BigDecimal fnAmount;
    private String description;

    // Detail lines (Tab 1.2)
    private List<LttDetailLine> details;

    // Sender info (Tab 1.3)
    private LttSenderInfo sender;

    // Receiver info (Tab 1.4)
    private LttReceiverInfo receiver;

    // Idempotency (Rule 2.3)
    private String idempotencyKey;

    /**
     * Single detail line for COA breakdown.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LttDetailLine {
        private String glSegment1;
        private String glSegment2;
        private String glSegment3;
        private String glSegment4;
        private String glSegment5;
        private String glSegment6;
        private String glSegment7;
        private String glSegment8;
        private String glSegment9;
        private String glSegment10;
        private String glSegment11;
        private String glSegment12;
        private String description;
        private BigDecimal amount;
    }

    /**
     * Sender information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LttSenderInfo {
        private String senderName;
        private String senderAddress;
        private String senderGlSegment2;
        private String senderNum;
        private String senderBankCode;
        private String senderIdentifyId;
        private LocalDate senderIssuedDate;
        private String senderIssuedPlace;
        private String tpcpCode;
    }

    /**
     * Receiver information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LttReceiverInfo {
        private String receiverName;
        private String receiverAddress;
        private String receiverGlSegment2;
        private String receiverBankName;
        private String receiverBankCode;
        private String receiverIdentifyId;
        private LocalDate receiverIssuedDate;
        private String receiverIssuedPlace;
    }
}
