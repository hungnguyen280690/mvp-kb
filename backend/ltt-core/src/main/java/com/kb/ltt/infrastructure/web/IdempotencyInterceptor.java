package com.kb.ltt.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Set;

/**
 * Interceptor that enforces the X-Idempotency-Key header on all state-changing
 * requests (POST / PUT / DELETE) to /api/**.
 *
 * <p>GET requests are always skipped (read-only).
 * Excluded path pattern: /api/pay-out-manual/{id}/validate-ccid
 * (real-time debounce endpoint - no idempotency needed).
 * </p>
 */
@Component
@Slf4j
public class IdempotencyInterceptor implements HandlerInterceptor {

    private static final String IDEMPOTENCY_KEY_HEADER = "X-Idempotency-Key";
    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "DELETE");

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws IOException {
        String method = request.getMethod();

        if (!MUTATING_METHODS.contains(method.toUpperCase())) {
            return true; // GET, HEAD, OPTIONS - no check needed
        }

        String key = request.getHeader(IDEMPOTENCY_KEY_HEADER);
        if (key != null && !key.isBlank()) {
            return true; // header present - allow through
        }

        log.warn("Missing X-Idempotency-Key header for {} {}", method, request.getRequestURI());

        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
                "{\"code\":\"MSG-ERR-IDEMPOTENCY\","
                + "\"message\":\"X-Idempotency-Key header is required for mutating requests.\","
                + "\"details\":[]}"
        );
        return false;
    }
}
