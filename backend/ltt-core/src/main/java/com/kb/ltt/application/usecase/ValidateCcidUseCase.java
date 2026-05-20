package com.kb.ltt.application.usecase;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates CCID (Chart of Account Combination ID) segments.
 * MVP: ensures all 12 segments are non-null and non-blank.
 */
@Service
public class ValidateCcidUseCase {

    // ── Inner records ─────────────────────────────────────────────────────

    public record CcidValidateRequest(List<String> segments, Integer lineNum) {}

    public record CcidValidateResponse(boolean valid, List<CcidError> errors) {}

    public record CcidError(String code, String message, String field) {}

    // ── Validation ────────────────────────────────────────────────────────

    /**
     * Validates that all 12 CCID segments are present and non-blank.
     *
     * @param req request containing segments list and optional lineNum
     * @return validation result with errors if any segment is invalid
     */
    public CcidValidateResponse validate(CcidValidateRequest req) {
        List<CcidError> errors = new ArrayList<>();
        List<String> segments = req.segments();

        for (int i = 0; i < 12; i++) {
            String segment = (segments != null && i < segments.size()) ? segments.get(i) : null;
            if (segment == null || segment.isBlank()) {
                int segNum = i + 1;
                errors.add(new CcidError(
                        "VAL-19",
                        "Segment " + segNum + " không hợp lệ",
                        "ccidSegment" + segNum
                ));
            }
        }

        return new CcidValidateResponse(errors.isEmpty(), errors);
    }
}
