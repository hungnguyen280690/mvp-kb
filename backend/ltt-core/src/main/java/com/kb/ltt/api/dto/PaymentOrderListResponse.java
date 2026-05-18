package com.kb.ltt.api.dto;

import com.kb.ltt.domain.model.enums.OrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class PaymentOrderListResponse {

    private Long id;
    private String uuid;
    private String refNo;
    private String channel;
    private String transactionType;
    private String lnhTransactionType;
    private LocalDate paymentDate;
    private LocalDateTime createdDate;
    private String sender;
    private String receiver;
    private String senderName;
    private String receiverName;
    private BigDecimal amount;
    private String currencyCode;
    private String description;
    private OrderStatus status;
    private String createdBy;
    private String checkedBy;
    private String approvedBy;
    private Integer version;
}
