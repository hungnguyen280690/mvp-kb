package com.kb.ltt.interfaces.rest.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Create request DTO matching openapi.yaml CreatePayOrderRequest schema.
 * Covers all fields from Tab B1.1, B1.2, B1.3, B1.4.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    // === Tab B1.1: General info ===
    @NotBlank(message = "CHANNEL is required")
    private String channel;

    private String orderType;

    private String lnhTransactionType;

    @NotBlank(message = "SENDER is required")
    @Size(max = 20)
    private String sender;

    @NotBlank(message = "RECEIVER is required")
    @Size(max = 20)
    private String receiver;

    @NotNull(message = "PAYMENT_DATE is required")
    private LocalDate paymentDate;

    @NotNull(message = "AMOUNT is required")
    @DecimalMin(value = "0.01", message = "AMOUNT must be greater than 0")
    private BigDecimal amount;

    @Size(max = 3)
    @Builder.Default
    private String currencyCode = "VND";

    private BigDecimal exchangeRate;

    @Size(max = 50)
    private String originNum;

    private LocalDate transactionDate;

    private String expType;

    @Size(max = 3)
    private String fnCode1;

    @Size(max = 3)
    private String fnCode2;

    private BigDecimal fnAmount;

    @NotBlank(message = "DESCRIPTION is required")
    @Size(max = 500)
    private String description;

    // === COA Lines ===
    @NotEmpty(message = "At least one LINES entry is required")
    @Valid
    private List<LineRequest> lines;

    // === Tab B1.3: Sender info ===
    @NotBlank(message = "SENDER_NAME is required")
    @Size(max = 200)
    private String senderName;

    @NotBlank(message = "SENDER_ADDRESS is required")
    @Size(max = 500)
    private String senderAddress;

    @NotBlank(message = "SENDER_GL_SEGMENT2 is required")
    @Size(max = 4)
    private String senderGlSegment2;

    @Size(max = 20)
    private String senderNum;

    @NotBlank(message = "SENDER_BANK_CODE is required")
    @Size(max = 20)
    private String senderBankCode;

    @Size(max = 50)
    private String senderIdentifyId;

    private LocalDate senderIssuedDate;

    @Size(max = 200)
    private String senderIssuedPlace;

    @Size(max = 20)
    private String tpcpCode;

    // === Tab B1.4: Receiver info ===
    @NotBlank(message = "RECEIVER_NAME is required")
    @Size(max = 200)
    private String receiverName;

    @Size(max = 500)
    private String receiverAddress;

    @NotBlank(message = "RECEIVER_GL_SEGMENT2 is required")
    @Size(max = 20)
    private String receiverGlSegment2;

    @NotBlank(message = "RECEIVER_BANK_CODE is required")
    @Size(max = 20)
    private String receiverBankCode;

    @NotBlank(message = "RECEIVER_ACCOUNT_NAME is required")
    @Size(max = 200)
    private String receiverAccountName;

    @Size(max = 50)
    private String receiverIdentifyId;

    private LocalDate receiverIssuedDate;

    @Size(max = 200)
    private String receiverIssuedPlace;

    /**
     * COA Line request matching openapi.yaml PayOrderLineRequest schema.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineRequest {
        @Size(max = 2)
        @Builder.Default
        private String glSegment1 = "01";

        @NotBlank(message = "GL_SEGMENT2 is required")
        @Size(max = 4)
        private String glSegment2;

        @NotBlank(message = "GL_SEGMENT3 is required")
        @Size(max = 7)
        private String glSegment3;

        @Size(max = 1)
        private String glSegment4;

        @Size(max = 3)
        @Builder.Default
        private String glSegment5 = "000";

        @Size(max = 3)
        @Builder.Default
        private String glSegment6 = "000";

        @Size(max = 4)
        @Builder.Default
        private String glSegment7 = "0000";

        @Size(max = 5)
        @Builder.Default
        private String glSegment8 = "00000";

        @Size(max = 5)
        @Builder.Default
        private String glSegment9 = "00000";

        @Size(max = 2)
        @Builder.Default
        private String glSegment10 = "00";

        @Size(max = 4)
        @Builder.Default
        private String glSegment11 = "0000";

        @Size(max = 3)
        @Builder.Default
        private String glSegment12 = "000";

        @NotBlank(message = "LINE_DESCRIPTION is required")
        @Size(max = 500)
        private String lineDescription;

        @NotNull(message = "LINE_AMOUNT is required")
        @DecimalMin(value = "0.01", message = "LINE_AMOUNT must be greater than 0")
        private BigDecimal lineAmount;
    }
}
