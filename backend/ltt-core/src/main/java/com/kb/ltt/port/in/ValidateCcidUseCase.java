package com.kb.ltt.port.in;

import java.util.List;

/**
 * Use case: Validate to hop COA segments (CCID).
 * BDD: Debounce 300ms tu FE, ADR-0006.
 */
public interface ValidateCcidUseCase {

    CcidValidationResponse validate(CcidValidationRequest request);

    /**
     * Request cho CCID validation.
     */
    record CcidValidationRequest(
            String glSegment1,
            String glSegment2,
            String glSegment3,
            String glSegment4,
            String glSegment5,
            String glSegment6,
            String glSegment7,
            String glSegment8,
            String glSegment9,
            String glSegment10,
            String glSegment11,
            String glSegment12
    ) {}

    /**
     * Response cho CCID validation.
     */
    record CcidValidationResponse(
            boolean valid,
            String ccidKey,
            List<CcidValidationError> errors
    ) {}

    /**
     * Chi tiet loi validation.
     */
    record CcidValidationError(
            String segment,
            String code,
            String message
    ) {}
}
