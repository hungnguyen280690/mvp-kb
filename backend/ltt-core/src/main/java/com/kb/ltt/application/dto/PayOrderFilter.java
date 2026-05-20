package com.kb.ltt.application.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Filter parameters for the PayOrder list endpoint.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderFilter {

    private List<String> status;
    private List<String> channel;
    private String refNo;
    private String receiverName;
    private LocalDate paymentDateFrom;
    private LocalDate paymentDateTo;
    private BigDecimal amountFrom;
    private BigDecimal amountTo;
    private String createdBy;
    private String kbnnId;
    private boolean includeDeleted;
}
