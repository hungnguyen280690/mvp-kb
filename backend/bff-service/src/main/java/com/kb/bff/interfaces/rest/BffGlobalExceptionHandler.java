package com.kb.bff.interfaces.rest;

import com.kb.bff.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Global exception handler for BFF service.
 * Translates exceptions into consistent ErrorResponse JSON matching the openapi.yaml schema.
 */
@Slf4j
@RestControllerAdvice
public class BffGlobalExceptionHandler {

    /**
     * Handle AccessDeniedException -> 403 Forbidden.
     * Thrown by {@link com.kb.bff.security.RbacChecker} when user lacks required permission.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .traceId(UUID.randomUUID().toString())
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-PERMISSION")
                .message("Ban khong co quyen thuc hien thao tac nay")
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Handle AuthenticationException -> 401 Unauthorized.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
        log.warn("Authentication failed: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .traceId(UUID.randomUUID().toString())
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-AUTH")
                .message("Token het han hoac khong hop le")
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handle IllegalStateException (no JWT in context) -> 401 Unauthorized.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        if (ex.getMessage() != null && ex.getMessage().contains("JWT")) {
            log.warn("JWT context error: {}", ex.getMessage());

            ErrorResponse error = ErrorResponse.builder()
                    .traceId(UUID.randomUUID().toString())
                    .timestamp(OffsetDateTime.now())
                    .code("MSG-ERR-AUTH")
                    .message("Token het han hoac khong hop le")
                    .build();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        return handleGeneric(ex);
    }

    /**
     * Handle WebClientResponseException -> proxy the upstream status/body.
     * This passes through the actual error from ltt-service.
     */
    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<String> handleWebClientResponse(WebClientResponseException ex) {
        log.warn("Upstream error: {} {}", ex.getStatusCode(), ex.getMessage());

        String responseBody = ex.getResponseBodyAsString(StandardCharsets.UTF_8);

        return ResponseEntity
                .status(ex.getStatusCode())
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(responseBody);
    }

    /**
     * Handle ResourceAccessException (ltt-service unreachable) -> 502 Bad Gateway.
     */
    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<ErrorResponse> handleResourceAccess(ResourceAccessException ex) {
        log.error("Backend service unreachable: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .traceId(UUID.randomUUID().toString())
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-SYSTEM")
                .message("Loi he thong. Vui long thu lai sau.")
                .build();

        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
    }

    /**
     * Handle IllegalArgumentException (bad request params) -> 400 Bad Request.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .traceId(UUID.randomUUID().toString())
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-VALIDATION")
                .message(ex.getMessage())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle all other exceptions -> 500 Internal Server Error.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);

        ErrorResponse error = ErrorResponse.builder()
                .traceId(UUID.randomUUID().toString())
                .timestamp(OffsetDateTime.now())
                .code("MSG-ERR-SYSTEM")
                .message("Loi he thong. Vui long thu lai sau.")
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
