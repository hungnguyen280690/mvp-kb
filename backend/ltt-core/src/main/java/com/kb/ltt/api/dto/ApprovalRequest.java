package com.kb.ltt.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalRequest {

    private String authMethod;
    private String otpCode;
    private String certSerial;

    @Size(min = 10, max = 500, message = "Ly do phai tu 10 den 500 ky tu")
    private String reason;

    private String idempotencyKey;
}
