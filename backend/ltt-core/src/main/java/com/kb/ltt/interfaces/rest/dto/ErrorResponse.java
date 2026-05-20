package com.kb.ltt.interfaces.rest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Error response DTO matching openapi.yaml ErrorResponse schema.
 * Format: {traceId, timestamp, code, message, details[]}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private String traceId;
    private OffsetDateTime timestamp;
    private String code;
    private String message;

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private List<ErrorDetail> details;

    /**
     * Single error detail matching openapi.yaml ErrorDetail schema.
     * Uses additionalProperties to allow extra fields like YOUR_VERSION, CURRENT_VERSION.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {
        private String field;
        private String message;

        /**
         * Additional properties for version mismatch details etc.
         */
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        private Map<String, Object> extra;
    }
}
