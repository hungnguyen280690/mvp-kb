package com.kb.ltt.application.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Input DTO for creating or updating a PayOrder.
 * Fields correspond to the openapi.yaml PayOrderRequest schema.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOrderRequest {

    // Tab: Thông tin chung
    private String channel;           // required
    private String orderType;
    private String lnhTransactionType;
    private String sender;            // required
    private String receiver;          // required
    private LocalDate paymentDate;    // required
    private String currencyCode;      // default VND
    private BigDecimal exchangeRate;
    private String originNum;
    private LocalDate transactionDate;
    private String expType;
    private String fnCode1;
    private String fnCode2;
    private BigDecimal fnAmount;
    private String description;       // required

    // Tab: Người chuyển
    private String senderName;        // required
    private String senderAddress;     // required
    private String senderGlSegment2;  // required
    private String senderNum;
    private String senderBankCode;    // required
    private String senderIdentifyId;
    private LocalDate senderIssuedDate;
    private String senderIssuedPlace;
    private String tpcpCode;

    // Tab: Người nhận
    private String receiverName;        // required
    private String receiverAddress;
    private String receiverGlSegment2;  // required
    private String receiverBankCode;    // required
    private String receiverAccountName; // required
    private String receiverIdentifyId;
    private LocalDate receiverIssuedDate;
    private String receiverIssuedPlace;

    // Lines
    private List<PayOrderLineRequest> lines;
}
