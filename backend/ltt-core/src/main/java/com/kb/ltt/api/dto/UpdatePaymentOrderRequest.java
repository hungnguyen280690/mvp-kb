package com.kb.ltt.api.dto;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class UpdatePaymentOrderRequest {

    private String channel;
    private String transactionType;
    private String lnhTransactionType;
    private String sender;
    private String receiver;
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
    @Valid
    private List<CreatePaymentOrderRequest.DetailLine> details;
    @Valid
    private CreatePaymentOrderRequest.SenderInfoDto senderInfo;
    @Valid
    private CreatePaymentOrderRequest.ReceiverInfoDto receiverInfo;
}
