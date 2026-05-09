package vn.gov.kbnn.vdbas.bff.exception;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class ErrorResponse {
    private String code;
    private String message;
    private String traceId;
    private OffsetDateTime timestamp;
}
