package com.kb.bff.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Update request DTO matching openapi.yaml UpdatePayOrderRequest schema.
 * All fields optional (partial update). Only valid when STATUS is DRAFT or RETURNED_TO_MAKER.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderRequest {

    // === Tab B1.1: General info ===
    private String channel;
    private String orderType;
    private String lnhTransactionType;

    @Size(max = 20)
    private String sender;

    @Size(max = 20)
    private String receiver;

    private LocalDate paymentDate;

    @DecimalMin(value = "0.01", message = "AMOUNT must be greater than 0")
    private BigDecimal amount;

    @Size(max = 3)
    private String currencyCode;

    private BigDecimal exchangeRate;

    @Size(max = 50)
    private String originNum;

    private LocalDate transactionDate;

    private String expType;

    @Size(max = 3)
    private String fnCode1;

    @Size(max = 3)
    private String fnCode2;

    private BigDecimal fnAmount;

    @Size(max = 500)
    private String description;

    // === COA Lines (full replacement) ===
    @Valid
    private List<CreateOrderRequest.LineRequest> lines;

    // === Tab B1.3: Sender info ===
    @Size(max = 200)
    private String senderName;

    @Size(max = 500)
    private String senderAddress;

    @Size(max = 4)
    private String senderGlSegment2;

    @Size(max = 20)
    private String senderNum;

    @Size(max = 20)
    private String senderBankCode;

    @Size(max = 50)
    private String senderIdentifyId;

    private LocalDate senderIssuedDate;

    @Size(max = 200)
    private String senderIssuedPlace;

    @Size(max = 20)
    private String tpcpCode;

    // === Tab B1.4: Receiver info ===
    @Size(max = 200)
    private String receiverName;

    @Size(max = 500)
    private String receiverAddress;

    @Size(max = 20)
    private String receiverGlSegment2;

    @Size(max = 20)
    private String receiverBankCode;

    @Size(max = 200)
    private String receiverAccountName;

    @Size(max = 50)
    private String receiverIdentifyId;

    private LocalDate receiverIssuedDate;

    @Size(max = 200)
    private String receiverIssuedPlace;
}
