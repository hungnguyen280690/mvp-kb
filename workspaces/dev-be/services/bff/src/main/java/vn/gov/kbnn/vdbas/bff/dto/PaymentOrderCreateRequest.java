package vn.gov.kbnn.vdbas.bff.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class PaymentOrderCreateRequest {

    private String requestNumber;

    @NotBlank(message = "Kenh thanh toan bat buoc")
    private String channel;

    @NotBlank(message = "Loai lenh bat buoc")
    private String orderType;

    private String transactionType;

    @NotBlank(message = "Ma NH nhan bat buoc")
    private String receiverBankCode;

    @NotNull(message = "Ngay thanh toan bat buoc")
    private LocalDate paymentDate;

    @NotNull(message = "So tien chuyen bat buoc")
    @DecimalMin(value = "0.01", message = "So tien phai lon hon 0")
    private BigDecimal amount;

    @NotBlank(message = "Loai tien bat buoc")
    private String currency = "VND";

    private BigDecimal exchangeRate;

    private String originalDocNo;
    private LocalDate originalDocDate;
    private String feeType;
    private String debitCurrency;
    private String paymentCurrency;
    private BigDecimal foreignAmount;

    @NotBlank(message = "Noi dung thanh toan bat buoc")
    @Size(max = 500, message = "Noi dung thanh toan toi da 500 ky tu")
    private String paymentContent;

    @NotEmpty(message = "Danh sach khoan muc bat buoc")
    @Valid
    private List<LineItemDto> lineItems;

    @Valid
    @NotNull(message = "Thong tin nguoi chuyen bat buoc")
    private SenderInfoDto senderInfo;

    @Valid
    @NotNull(message = "Thong tin nguoi nhan bat buoc")
    private ReceiverInfoDto receiverInfo;
}
