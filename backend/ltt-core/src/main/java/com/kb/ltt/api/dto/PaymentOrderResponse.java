package com.kb.ltt.api.dto;

import com.kb.ltt.domain.model.enums.OrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PaymentOrderResponse {

    private Long id;
    private String uuid;
    private String refNo;
    private String channel;
    private String transactionType;
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
    private OrderStatus status;
    private Integer version;
    private String createdBy;
    private LocalDateTime createdDate;
    private String lastUpdatedBy;
    private LocalDateTime lastUpdatedDate;
    private String checkedBy;
    private LocalDateTime checkedDate;
    private String approvedBy;
    private LocalDateTime approvedDate;

    private String senderName;
    private String senderAddress;
    private String senderGlSegment2;
    private String senderNum;
    private String senderBankCode;
    private String senderIdentifyId;
    private LocalDate senderIssuedDate;
    private String senderIssuedPlace;
    private String tpcpCode;

    private String receiverName;
    private String receiverAddress;
    private String receiverGlSegment2;
    private String receiverBankName;
    private String receiverBankCode;
    private String receiverIdentifyId;
    private LocalDate receiverIssuedDate;
    private String receiverIssuedPlace;

    private List<DetailLineResponse> details;

    @Getter
    @Builder
    public static class DetailLineResponse {
        private Long id;
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
        private String lineDescription;
        private BigDecimal lineAmount;
    }
}
