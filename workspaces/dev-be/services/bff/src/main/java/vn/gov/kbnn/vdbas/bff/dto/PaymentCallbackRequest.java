package vn.gov.kbnn.vdbas.bff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
public class PaymentCallbackRequest {
    @NotBlank
    private String correlationId;
    @NotBlank
    private String requestId;
    @NotBlank
    private String channel;  // LNH, SP, LKB
    @NotBlank
    private String status;   // SUCCESS, FAIL, PENDING, TIMEOUT
    @NotNull
    private OffsetDateTime timestamp;

    private String errorCode;
    private String errorMessage;
    private String providerRefId;
    private String settlementDate;
    private Double amount;
    private String currency;
    private String signature;
    private Map<String, String> additionalData;
}
