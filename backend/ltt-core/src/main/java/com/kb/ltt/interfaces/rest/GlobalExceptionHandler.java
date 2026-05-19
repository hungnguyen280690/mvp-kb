package com.kb.ltt.interfaces.rest;

import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.domain.exception.InvalidStateTransitionException;
import com.kb.ltt.domain.exception.OptimisticLockException;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.domain.exception.SoDViolationException;
import com.kb.ltt.interfaces.rest.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Global exception handler for all REST controllers.
 * Maps domain exceptions to appropriate HTTP status codes and ErrorResponse DTOs.
 * <p>
 * Error codes follow the spec section A9 message code catalogue:
 * - MSG-ERR-LOCK       -> 409 Optimistic lock conflict
 * - MSG-ERR-SOD        -> 403 Segregation of Duties violation
 * - MSG-ERR-STATUS     -> 409 Invalid state transition
 * - MSG-ERR-VALIDATION -> 400 Request validation failed
 * - MSG-ERR-NOTFOUND   -> 404 Resource not found
 * - MSG-ERR-SYSTEM     -> 500 Unexpected error
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // =========================================================================
    // 409 Conflict — Optimistic Lock
    // =========================================================================

    @ExceptionHandler(OptimisticLockException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(
            OptimisticLockException ex,
            HttpServletRequest request
    ) {
        log.warn("Optimistic lock conflict: {}", ex.getMessage());

        ErrorResponse.ErrorDetail detail = ErrorResponse.ErrorDetail.builder()
                .field("F-VER")
                .message(ex.getMessage())
                .extra(Map.of(
                        "YOUR_VERSION", ex.getExpectedVersion(),
                        "CURRENT_VERSION", ex.getCurrentVersion()
                ))
                .build();

        ErrorResponse response = ErrorResponse.builder()
                .traceId(resolveTraceId(request))
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-LOCK")
                .message("Bản ghi đã bị thay đổi từ phiên khác. Vui lòng tải lại.")
                .details(List.of(detail))
                .build();

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
    }

    // =========================================================================
    // 403 Forbidden — SoD Violation
    // =========================================================================

    @ExceptionHandler(SoDViolationException.class)
    public ResponseEntity<ErrorResponse> handleSoDViolation(
            SoDViolationException ex,
            HttpServletRequest request
    ) {
        log.warn("SoD violation: {}", ex.getMessage());

        ErrorResponse.ErrorDetail detail = ErrorResponse.ErrorDetail.builder()
                .field("ROLE")
                .message(ex.getMessage())
                .build();

        ErrorResponse response = ErrorResponse.builder()
                .traceId(resolveTraceId(request))
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-SOD")
                .message("Bạn không có quyền thực hiện thao tác này do vi phạm phân quyền (SoD).")
                .details(List.of(detail))
                .build();

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(response);
    }

    // =========================================================================
    // 409 Conflict — Invalid State Transition
    // =========================================================================

    @ExceptionHandler(InvalidStateTransitionException.class)
    public ResponseEntity<ErrorResponse> handleInvalidStateTransition(
            InvalidStateTransitionException ex,
            HttpServletRequest request
    ) {
        log.warn("Invalid state transition: {}", ex.getMessage());

        ErrorResponse.ErrorDetail detail = ErrorResponse.ErrorDetail.builder()
                .field("STATUS")
                .message(ex.getMessage())
                .extra(Map.of(
                        "FROM_STATUS", ex.getFromStatus().name(),
                        "TO_STATUS", ex.getToStatus().name()
                ))
                .build();

        ErrorResponse response = ErrorResponse.builder()
                .traceId(resolveTraceId(request))
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-STATUS")
                .message("Chuyển trạng thái không hợp lệ.")
                .details(List.of(detail))
                .build();

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
    }

    // =========================================================================
    // 422 Unprocessable Entity — Business Rule Violation
    // =========================================================================

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(
            BusinessRuleException ex,
            HttpServletRequest request
    ) {
        log.warn("Business rule violation [{}]: {}", ex.getRuleCode(), ex.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .traceId(resolveTraceId(request))
                .timestamp(OffsetDateTime.now())
                .code(ex.getRuleCode())
                .message(ex.getMessage())
                .build();

        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(response);
    }

    // =========================================================================
    // 404 Not Found — Resource Not Found
    // =========================================================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request
    ) {
        log.warn("Resource not found: {}", ex.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .traceId(resolveTraceId(request))
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-NOTFOUND")
                .message(ex.getMessage())
                .build();

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(response);
    }

    // =========================================================================
    // 400 Bad Request — Validation Error
    // =========================================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        log.warn("Validation error: {}", ex.getMessage());

        List<ErrorResponse.ErrorDetail> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fieldError -> ErrorResponse.ErrorDetail.builder()
                        .field(fieldError.getField())
                        .message(fieldError.getDefaultMessage())
                        .build())
                .toList();

        ErrorResponse response = ErrorResponse.builder()
                .traceId(resolveTraceId(request))
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-VALIDATION")
                .message("Dữ liệu không hợp lệ")
                .details(details)
                .build();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // =========================================================================
    // 400 Bad Request — Illegal Argument (e.g. missing If-Match)
    // =========================================================================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        log.warn("Illegal argument: {}", ex.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .traceId(resolveTraceId(request))
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-VALIDATION")
                .message(ex.getMessage())
                .build();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // =========================================================================
    // 500 Internal Server Error — Catch-all
    // =========================================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex,
            HttpServletRequest request
    ) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);

        ErrorResponse response = ErrorResponse.builder()
                .traceId(resolveTraceId(request))
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-SYSTEM")
                .message("Lỗi hệ thống. Vui lòng thử lại sau.")
                .build();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    // =========================================================================
    // Helper methods
    // =========================================================================

    /**
     * Resolve trace ID from request headers.
     * Checks X-Request-Id first, then falls back to request trace ID.
     */
    private String resolveTraceId(HttpServletRequest request) {
        String traceId = request.getHeader("X-Request-Id");
        if (traceId != null && !traceId.isBlank()) {
            return traceId;
        }
        return request.getRequestId();
    }
}
