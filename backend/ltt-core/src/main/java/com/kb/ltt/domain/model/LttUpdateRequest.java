package com.kb.ltt.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for updating an existing LTT.
 * Includes fVer for optimistic lock validation (VAL-15).
 *
 * // FT-001: LTT update request payload
 * // VAL-15: Optimistic lock check via fVer
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttUpdateRequest {

    // Optimistic lock version - must match current DB value
    private Integer fVer;

    // General Info (Tab 1.1) - updatable fields
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
    private List<LttCreateRequest.LttDetailLine> details;

    // Sender info (Tab 1.3)
    private LttCreateRequest.LttSenderInfo sender;

    // Receiver info (Tab 1.4)
    private LttCreateRequest.LttReceiverInfo receiver;

    // Idempotency (Rule 2.3)
    private String idempotencyKey;
}
