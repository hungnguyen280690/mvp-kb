package vn.gov.kbnn.vdbas.bff.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class PaymentOrderResponse {
    private UUID id;
    private long version;
    private String status;
    private String requestNumber;
    private String channel;
    private String orderType;
    private String transactionType;
    private String senderBankCode;
    private String senderBankName;
    private String receiverBankCode;
    private String receiverBankName;
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
    private String makerId;
    private String makerName;
    private OffsetDateTime createdAt;
    private List<LineItemDto> lineItems;
    private SenderInfoDto senderInfo;
    private ReceiverInfoDto receiverInfo;
    private List<AttachmentInfoDto> attachments;
    private String checkerId;
    private String checkerName;
    private OffsetDateTime checkedAt;
    private String approverId;
    private String approverName;
    private OffsetDateTime approvedAt;
    private OffsetDateTime signedAt;
    private String providerRefId;
    private LocalDate settlementDate;
    private String glVoucherNo;
    private UUID reversalOfId;
    private BigDecimal holdAmount;
    private String rejectReason;
    private boolean deleted;
    private OffsetDateTime updatedAt;
    private String updatedBy;
}
