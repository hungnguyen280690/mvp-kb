package com.kb.ltt.application.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Shortened DTO for the PayOrder list view.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderSummary {

    private String id;
    private Long version;
    private String status;
    private String refNo;
    private String channel;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private String currencyCode;
    private String receiverName;
    private String description;
    private String createdBy;
    private Instant createdAt;
    private String kbnnId;
    private int attachmentCount;
}
