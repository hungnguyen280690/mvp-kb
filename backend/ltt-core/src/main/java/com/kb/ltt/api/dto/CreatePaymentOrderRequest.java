package com.kb.ltt.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class CreatePaymentOrderRequest {

    @NotBlank(message = "Vui long nhap Kenh")
    private String channel;

    @NotBlank(message = "Vui long nhap Loai lenh")
    private String transactionType;

    private String lnhTransactionType;

    @NotBlank(message = "Vui long nhap NH/KB chuyen")
    private String sender;

    @NotBlank(message = "Vui long nhap NH/KB nhan")
    private String receiver;

    @NotBlank(message = "Vui long nhap So YCTT")
    private String refNo;

    @NotNull(message = "Vui long nhap Ngay thanh toan")
    private LocalDate paymentDate;

    @NotNull(message = "Vui long nhap So tien")
    @DecimalMin(value = "0.01", message = "So tien phai lon hon 0")
    private BigDecimal amount;

    private String currencyCode = "VND";
    private BigDecimal exchangeRate;
    private String originNum;
    private LocalDate transactionDate;
    private String expType;
    private String fnCode1;
    private String fnCode2;
    private BigDecimal fnAmount;

    @NotBlank(message = "Vui long nhap Noi dung thanh toan")
    @Size(max = 1000)
    private String description;

    @NotEmpty(message = "Vui long nhap dong chi tiet")
    @Valid
    private List<DetailLine> details;

    @NotNull(message = "Vui long nhap Thong tin nguoi chuyen")
    @Valid
    private SenderInfoDto senderInfo;

    @NotNull(message = "Vui long nhap Thong tin nguoi nhan")
    @Valid
    private ReceiverInfoDto receiverInfo;

    @Getter
    @Setter
    public static class DetailLine {
        private Integer lineNo;

        private String glSegment1 = "01";
        @NotBlank(message = "Vui long nhap TK tu nhien")
        private String glSegment2;
        @NotBlank(message = "Vui long nhap DVQHNS")
        private String glSegment3;
        private String glSegment4;
        private String glSegment5 = "000";
        private String glSegment6 = "000";
        private String glSegment7 = "0000";
        private String glSegment8 = "00000";
        private String glSegment9 = "00000";
        private String glSegment10 = "00";
        private String glSegment11 = "0000";
        private String glSegment12 = "00";

        @NotBlank(message = "Vui long nhap Dien giai")
        private String lineDescription;

        @NotNull(message = "Vui long nhap So tien dong")
        @DecimalMin(value = "0.01", message = "So tien dong phai lon hon 0")
        private BigDecimal lineAmount;
    }

    @Getter
    @Setter
    public static class SenderInfoDto {
        @NotBlank(message = "Vui long nhap Ten nguoi chuyen")
        private String senderName;
        private String senderAddress;
        @NotBlank(message = "Vui long nhap TK nguoi chuyen")
        private String senderGlSegment2;
        private String senderNum;
        @NotBlank(message = "Vui long nhap Mo tai NH/KB")
        private String senderBankCode;
        private String senderIdentifyId;
        private LocalDate senderIssuedDate;
        private String senderIssuedPlace;
        private String tpcpCode;
    }

    @Getter
    @Setter
    public static class ReceiverInfoDto {
        @NotBlank(message = "Vui long nhap Ten nguoi nhan")
        private String receiverName;
        private String receiverAddress;
        @NotBlank(message = "Vui long nhap TK nguoi nhan")
        private String receiverGlSegment2;
        @NotBlank(message = "Vui long nhap Mo tai NH/KB nguoi nhan")
        private String receiverBankName;
        @NotBlank(message = "Vui long nhap Ten tai khoan nguoi nhan")
        private String receiverBankCode;
        private String receiverIdentifyId;
        private LocalDate receiverIssuedDate;
        private String receiverIssuedPlace;
    }
}
