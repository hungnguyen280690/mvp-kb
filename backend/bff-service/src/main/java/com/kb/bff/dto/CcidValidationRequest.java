package com.kb.bff.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * CCID validation request DTO matching openapi.yaml ValidateCCIDRequest schema.
 * Contains list of COA segment combinations to validate.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CcidValidationRequest {

    @NotEmpty(message = "At least one LINES entry is required")
    @Valid
    private List<CcidLineRequest> lines;

    /**
     * Single COA line for validation.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CcidLineRequest {

        @Size(max = 2)
        @Builder.Default
        private String glSegment1 = "01";

        @Size(max = 4)
        private String glSegment2;

        @Size(max = 7)
        private String glSegment3;

        @Size(max = 1)
        private String glSegment4;

        @Size(max = 3)
        @Builder.Default
        private String glSegment5 = "000";

        @Size(max = 3)
        @Builder.Default
        private String glSegment6 = "000";

        @Size(max = 4)
        @Builder.Default
        private String glSegment7 = "0000";

        @Size(max = 5)
        @Builder.Default
        private String glSegment8 = "00000";

        @Size(max = 5)
        @Builder.Default
        private String glSegment9 = "00000";

        @Size(max = 2)
        @Builder.Default
        private String glSegment10 = "00";

        @Size(max = 4)
        @Builder.Default
        private String glSegment11 = "0000";

        @Size(max = 3)
        @Builder.Default
        private String glSegment12 = "000";
    }
}
