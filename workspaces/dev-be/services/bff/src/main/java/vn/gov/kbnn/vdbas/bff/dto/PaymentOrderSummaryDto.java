package vn.gov.kbnn.vdbas.bff.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
public class PaymentOrderSummaryDto {
    private Long id;
    private String requestNumber;
    private String channel;
    private String orderType;
    private String senderBankCode;
    private String senderBankName;
    private String receiverBankCode;
    private String receiverBankName;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String makerName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private long version;
}
