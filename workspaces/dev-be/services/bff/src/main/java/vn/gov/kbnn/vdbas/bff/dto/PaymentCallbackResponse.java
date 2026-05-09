package vn.gov.kbnn.vdbas.bff.dto;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class PaymentCallbackResponse {
    private String responseCode;  // 00, 01, 02, 99
    private String responseMessage;
    private OffsetDateTime receivedAt;
}
