package com.kb.ltt.infrastructure.web;

import com.kb.ltt.application.dto.ErrorResponse;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.domain.exception.InvalidStatusTransitionException;
import com.kb.ltt.domain.exception.OptimisticLockException;
import com.kb.ltt.domain.exception.SoDViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Global exception handler - maps domain exceptions to HTTP error responses.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── OptimisticLockException ───────────────────────────────────────────

    @ExceptionHandler(OptimisticLockException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(OptimisticLockException ex) {
        log.warn("Optimistic lock conflict: {}", ex.getMessage());
        List<Object> details = List.of(Map.of(
                "field", "version",
                "yourVersion", ex.getYourVersion(),
                "currentVersion", ex.getCurrentVersion()
        ));
        ErrorResponse body = new ErrorResponse(
                traceId(),
                now(),
                ex.getCode(),
                ex.getMessage(),
                details
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    // ── SoDViolationException ─────────────────────────────────────────────

    @ExceptionHandler(SoDViolationException.class)
    public ResponseEntity<ErrorResponse> handleSoDViolation(SoDViolationException ex) {
        log.warn("SoD violation: {}", ex.getMessage());
        ErrorResponse body = new ErrorResponse(
                traceId(), now(), ex.getCode(), ex.getMessage(), List.of()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // ── InvalidStatusTransitionException ─────────────────────────────────

    @ExceptionHandler(InvalidStatusTransitionException.class)
    public ResponseEntity<ErrorResponse> handleInvalidStatusTransition(InvalidStatusTransitionException ex) {
        log.warn("Invalid status transition: {}", ex.getMessage());
        ErrorResponse body = new ErrorResponse(
                traceId(), now(), ex.getCode(), ex.getMessage(), List.of()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    // ── BusinessException (catch-all for remaining business errors) ────────

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        log.warn("Business error [{}]: {}", ex.getCode(), ex.getMessage());

        HttpStatus status = resolveStatus(ex.getCode());
        ErrorResponse body = new ErrorResponse(
                traceId(), now(), ex.getCode(), ex.getMessage(), List.of()
        );
        return ResponseEntity.status(status).body(body);
    }

    // ── Validation ────────────────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<Object> details = ex.getBindingResult().getAllErrors().stream()
                .<Object>map(err -> {
                    if (err instanceof FieldError fe) {
                        return Map.of(
                                "field", fe.getField(),
                                "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid"
                        );
                    }
                    return Map.of("message", err.getDefaultMessage() != null ? err.getDefaultMessage() : "invalid");
                })
                .toList();

        ErrorResponse body = new ErrorResponse(
                traceId(), now(), "MSG-ERR-VALIDATION", "Dữ liệu không hợp lệ.", details
        );
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    // ── Catch-all ─────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        ErrorResponse body = new ErrorResponse(
                traceId(), now(), "MSG-ERR-INTERNAL", "Lỗi hệ thống. Vui lòng thử lại sau.", List.of()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private HttpStatus resolveStatus(String code) {
        if (code == null) return HttpStatus.UNPROCESSABLE_ENTITY;
        return switch (code) {
            case "MSG-ERR-NOT-FOUND" -> HttpStatus.NOT_FOUND;
            default                  -> HttpStatus.UNPROCESSABLE_ENTITY;
        };
    }

    private String traceId() {
        return UUID.randomUUID().toString();
    }

    private String now() {
        return Instant.now().toString();
    }
}
