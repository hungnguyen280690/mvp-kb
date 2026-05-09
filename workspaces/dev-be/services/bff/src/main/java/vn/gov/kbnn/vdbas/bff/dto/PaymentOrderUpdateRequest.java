package vn.gov.kbnn.vdbas.bff.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class PaymentOrderUpdateRequest {
    private String channel;
    private String orderType;
    private String transactionType;
    private String receiverBankCode;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private String currency;
    private BigDecimal exchangeRate;
    private String originalDocNo;
    private LocalDate originalDocDate;
    private String feeType;
    private String debitCurrency;
    private String paymentCurrency;
    private BigDecimal foreignAmount;
    private String paymentContent;

    @Valid
    private List<LineItemDto> lineItems;

    @Valid
    private SenderInfoDto senderInfo;

    @Valid
    private ReceiverInfoDto receiverInfo;
}
