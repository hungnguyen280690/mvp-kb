package com.kb.ltt.application.dto;

import java.util.List;

/**
 * Standard error response payload for all REST error scenarios.
 */
public record ErrorResponse(
        String traceId,
        String timestamp,
        String code,
        String message,
        List<Object> details
) {}
