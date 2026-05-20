package com.kb.bff.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Response DTO matching openapi.yaml PayOrderDetailResponse schema.
 * Contains all fields for a single payment order detail view.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderResponse {

    // === Primary keys & version ===
    private String id;
    private Integer version;
    private String status;
    private String refNo;

    // === Tab B1.1: General info ===
    private String channel;
    private String orderType;
    private String lnhTransactionType;
    private String sender;
    private String receiver;
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

    // === Tab B1.3: Sender info ===
    private String senderName;
    private String senderAddress;
    private String senderGlSegment2;
    private String senderNum;
    private String senderBankCode;
    private String senderIdentifyId;
    private LocalDate senderIssuedDate;
    private String senderIssuedPlace;
    private String tpcpCode;

    // === Tab B1.4: Receiver info ===
    private String receiverName;
    private String receiverAddress;
    private String receiverGlSegment2;
    private String receiverBankCode;
    private String receiverAccountName;
    private String receiverIdentifyId;
    private LocalDate receiverIssuedDate;
    private String receiverIssuedPlace;

    // === COA Lines ===
    private List<PayOrderLineResponse> lines;

    // === Workflow attribution ===
    private String kbnnId;
    private String createdBy;
    private OffsetDateTime createdAt;
    private String createdIp;
    private String updatedBy;
    private OffsetDateTime updatedAt;
    private String updatedIp;
    private String checkerId;
    private OffsetDateTime checkerActionAt;
    private String checkerComment;
    private String approverId;
    private OffsetDateTime approverActionAt;
    private String approverComment;

    // === Soft delete ===
    private String deleteReason;
    private String deletedBy;
    private OffsetDateTime deletedAt;

    // === Attachment summary ===
    private Integer attachmentCount;

    /**
     * Nested DTO for PayOrderLine response.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayOrderLineResponse {
        private String id;
        private String orderId;
        private Integer lineNo;
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
        private String ccidKey;
        private String lineDescription;
        private BigDecimal lineAmount;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
    }
}
