package vn.gov.kbnn.vdbas.bff.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Global exception handler cho BFF.
 * Mapping tu OpenAPI error responses.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ValidationErrorResponse.Violation> violations = new ArrayList<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            violations.add(new ValidationErrorResponse.Violation(
                    "E-VAL-005",
                    error.getField(),
                    error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value"
            ));
        });

        ValidationErrorResponse response = new ValidationErrorResponse();
        response.setCode("422");
        response.setMessage("Validate that bai");
        response.setTraceId(UUID.randomUUID().toString());
        response.setTimestamp(OffsetDateTime.now());
        response.setViolations(violations);

        return ResponseEntity.unprocessableEntity().body(response);
    }

    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<ErrorResponse> handleUpstreamError(HttpClientErrorException ex) {
        log.error("Upstream service error: status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
        ErrorResponse response = new ErrorResponse();
        response.setCode(String.valueOf(ex.getStatusCode().value()));
        response.setMessage(ex.getStatusText());
        response.setTraceId(UUID.randomUUID().toString());
        response.setTimestamp(OffsetDateTime.now());
        return ResponseEntity.status(ex.getStatusCode()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        ErrorResponse response = new ErrorResponse();
        response.setCode("500");
        response.setMessage("Loi he thong, vui long thu lai sau");
        response.setTraceId(UUID.randomUUID().toString());
        response.setTimestamp(OffsetDateTime.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
