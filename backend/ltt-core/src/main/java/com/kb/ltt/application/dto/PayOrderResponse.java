package com.kb.ltt.application.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Full response DTO for a PayOrder, matching the openapi.yaml PayOrderResponse schema.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderResponse {

    // Identity / lifecycle
    private String id;
    private Long version;
    private String status;
    private String refNo;
    private String kbnnId;

    // Tab: Thông tin chung
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

    // Tab: Người chuyển
    private String senderName;
    private String senderAddress;
    private String senderGlSegment2;
    private String senderNum;
    private String senderBankCode;
    private String senderIdentifyId;
    private LocalDate senderIssuedDate;
    private String senderIssuedPlace;
    private String tpcpCode;

    // Tab: Người nhận
    private String receiverName;
    private String receiverAddress;
    private String receiverGlSegment2;
    private String receiverBankCode;
    private String receiverAccountName;
    private String receiverIdentifyId;
    private LocalDate receiverIssuedDate;
    private String receiverIssuedPlace;

    // Audit trail — creation
    private String createdBy;
    private Instant createdAt;

    // Audit trail — last update
    private String updatedBy;
    private Instant updatedAt;

    // Workflow — checker
    private String checkerId;
    private Instant checkerActionAt;
    private String checkerComment;

    // Workflow — approver
    private String approverId;
    private Instant approverActionAt;
    private String approverComment;

    // Soft delete
    private String deleteReason;
    private String deletedBy;
    private Instant deletedAt;

    // Derived
    private int attachmentCount;

    // Line items
    private List<PayOrderLineResponse> lines;
}
