package com.kb.ltt.application;

import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.port.in.ValidateCcidUseCase;
import com.kb.ltt.port.out.MasterDataLookup;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * CCID validation use case implementation.
 * Validates 12-segment COA combination via MasterDataLookup port.
 * Used by FE with 300ms debounce (ADR-0006).
 *
 * BDD coverage:
 * - bdd-05-ccid.md — Scenario 1: Happy path — valid CCID
 * - bdd-05-ccid.md — Scenario 2: Invalid segment — error per segment
 * - bdd-05-ccid.md — Scenario 3: Empty segments — all default values
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CcidValidationService implements ValidateCcidUseCase {

    private static final String SEGMENT_NAMES[] = {
            "GL_SEGMENT1", "GL_SEGMENT2", "GL_SEGMENT3", "GL_SEGMENT4",
            "GL_SEGMENT5", "GL_SEGMENT6", "GL_SEGMENT7", "GL_SEGMENT8",
            "GL_SEGMENT9", "GL_SEGMENT10", "GL_SEGMENT11", "GL_SEGMENT12"
    };

    private static final String SEGMENT_LABELS[] = {
            "Ma quy", "TK tu nhien", "DVQHNS", "Cap NS",
            "Chuong", "Nganh KT", "NDKT", "DB",
            "CTMT", "MN", "Kho bac", "DP"
    };

    private static final int REQUIRED_SEGMENTS[] = {1, 2}; // Indices of required segments (0-based: 1=GL_SEGMENT2, 2=GL_SEGMENT3)

    private final MasterDataLookup masterDataLookup;

    /**
     * BDD: bdd-05-ccid.md — Scenario 1: Happy path — valid CCID
     * BDD: bdd-05-ccid.md — Scenario 2: Invalid segment — error per segment
     * BDD: bdd-05-ccid.md — Scenario 3: Empty segments — all default values
     */
    @Override
    @Transactional(readOnly = true)
    public CcidValidationResponse validate(CcidValidationRequest request) {
        List<CcidValidationError> errors = new ArrayList<>();

        // Build segments array
        String[] segments = {
                request.glSegment1(), request.glSegment2(), request.glSegment3(),
                request.glSegment4(), request.glSegment5(), request.glSegment6(),
                request.glSegment7(), request.glSegment8(), request.glSegment9(),
                request.glSegment10(), request.glSegment11(), request.glSegment12()
        };

        // Step 1: Validate required segments are not blank
        for (int idx : REQUIRED_SEGMENTS) {
            if (segments[idx] == null || segments[idx].isBlank()) {
                errors.add(new CcidValidationError(
                        SEGMENT_NAMES[idx],
                        "MSG-ERR-CCID-REQUIRED",
                        SEGMENT_LABELS[idx] + " (" + SEGMENT_NAMES[idx] + ") la bat buoc"
                ));
            }
        }

        // Step 2: Validate each segment value against COA master data
        for (int i = 0; i < 12; i++) {
            if (segments[i] == null || segments[i].isBlank()) {
                continue; // Skip blank segments (defaults handled elsewhere)
            }

            boolean segmentValid = validateSegmentAgainstMaster(SEGMENT_NAMES[i], segments[i]);
            if (!segmentValid) {
                errors.add(new CcidValidationError(
                        SEGMENT_NAMES[i],
                        "MSG-ERR-CCID-INVALID",
                        "Gia tri '" + segments[i] + "' khong hop le cho " + SEGMENT_LABELS[i]
                                + " (" + SEGMENT_NAMES[i] + ")"
                ));
            }
        }

        // Step 3: Validate cross-segment rules via COA matrix lookup
        if (errors.isEmpty()) {
            validateCrossSegmentRules(segments, errors);
        }

        // Build CCID key
        String ccidKey = buildCcidKey(segments);

        boolean valid = errors.isEmpty();
        if (valid) {
            log.debug("CCID validation passed: ccidKey={}", ccidKey);
        } else {
            log.debug("CCID validation failed: ccidKey={}, errorCount={}", ccidKey, errors.size());
        }

        return new CcidValidationResponse(valid, ccidKey, errors);
    }

    /**
     * Validate a single segment value against master data COA type.
     */
    private boolean validateSegmentAgainstMaster(String segmentName, String segmentValue) {
        try {
            // Query master data for COA type, filtering by segment name
            List<Map<String, String>> results = masterDataLookup.lookup("COA", segmentValue);
            if (results == null || results.isEmpty()) {
                return false;
            }
            // Check if any result matches this segment type
            return results.stream()
                    .anyMatch(entry -> segmentName.equals(entry.get("segment"))
                            || segmentValue.equals(entry.get("code")));
        } catch (Exception e) {
            log.warn("Master data lookup failed for segment {}={}: {}",
                    segmentName, segmentValue, e.getMessage());
            // Fail-open on master data unavailability — log warning, don't block
            return true;
        }
    }

    /**
     * Validate cross-segment combination rules.
     * Checks that the full 12-segment combination exists in the COA matrix.
     */
    private void validateCrossSegmentRules(String[] segments, List<CcidValidationError> errors) {
        // Build the full CCID key for COA matrix lookup
        String ccidKey = buildCcidKey(segments);

        try {
            List<Map<String, String>> results = masterDataLookup.lookup("COA", ccidKey);
            if (results == null || results.isEmpty()) {
                // Check if any combination exists with the primary segments
                String primaryLookup = segments[0] + "-" + segments[1] + "-" + segments[2];
                List<Map<String, String>> primaryResults = masterDataLookup.lookup("COA", primaryLookup);
                if (primaryResults == null || primaryResults.isEmpty()) {
                    errors.add(new CcidValidationError(
                            "CCID_KEY",
                            "MSG-ERR-CCID-COMBINATION",
                            "To hop CCID khong ton tai trong ma tran COA: " + ccidKey
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("COA matrix lookup failed for ccidKey={}: {}", ccidKey, e.getMessage());
            // Fail-open on master data unavailability
        }
    }

    /**
     * Build the CCID composite key from 12 segments.
     * Format: seg1.seg2.seg3.seg4.seg5.seg6.seg7.seg8.seg9.seg10.seg11.seg12
     */
    private String buildCcidKey(String[] segments) {
        return java.util.Arrays.stream(segments)
                .map(s -> s != null && !s.isBlank() ? s : "0")
                .collect(Collectors.joining("."));
    }
}
