package com.kb.bff.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * CCID validation response DTO matching openapi.yaml ValidateCCIDResponse schema.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CcidValidationResponse {

    private Boolean valid;
    private List<CcidLineResult> results;

    /**
     * Per-line CCID validation result matching openapi.yaml ValidateCCIDLineResult schema.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CcidLineResult {
        private Integer lineIndex;
        private String ccidKey;
        private Boolean valid;
        private List<CcidError> errors;
    }

    /**
     * Single segment validation error.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CcidError {
        private String segment;
        private String message;
    }
}
