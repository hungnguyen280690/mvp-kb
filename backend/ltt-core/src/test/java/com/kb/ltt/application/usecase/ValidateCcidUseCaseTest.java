package com.kb.ltt.application.usecase;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for ValidateCcidUseCase — no Spring context needed.
 */
@DisplayName("ValidateCcidUseCase — unit")
class ValidateCcidUseCaseTest {

    private final ValidateCcidUseCase useCase = new ValidateCcidUseCase();

    @Test
    @DisplayName("12 valid non-blank segments → valid=true, no errors")
    void validate_allValid_returnsTrue() {
        List<String> segments = List.of("S1", "S2", "S3", "S4", "S5", "S6",
                                        "S7", "S8", "S9", "S10", "S11", "S12");

        ValidateCcidUseCase.CcidValidateResponse resp =
                useCase.validate(new ValidateCcidUseCase.CcidValidateRequest(segments, 1));

        assertThat(resp.valid()).isTrue();
        assertThat(resp.errors()).isEmpty();
    }

    @Test
    @DisplayName("blank segment 3 → valid=false, error for segment 3")
    void validate_blankSegment_returnsFalse() {
        List<String> segments = List.of("S1", "S2", "", "S4", "S5", "S6",
                                        "S7", "S8", "S9", "S10", "S11", "S12");

        ValidateCcidUseCase.CcidValidateResponse resp =
                useCase.validate(new ValidateCcidUseCase.CcidValidateRequest(segments, 1));

        assertThat(resp.valid()).isFalse();
        assertThat(resp.errors()).hasSize(1);
        assertThat(resp.errors().get(0).code()).isEqualTo("VAL-19");
        assertThat(resp.errors().get(0).field()).isEqualTo("ccidSegment3");
    }

    @Test
    @DisplayName("null segment → valid=false, error for that segment")
    void validate_nullSegment_returnsFalse() {
        List<String> segments = Arrays.asList("S1", "S2", "S3", null, "S5", "S6",
                                              "S7", "S8", "S9", "S10", "S11", "S12");

        ValidateCcidUseCase.CcidValidateResponse resp =
                useCase.validate(new ValidateCcidUseCase.CcidValidateRequest(segments, 2));

        assertThat(resp.valid()).isFalse();
        assertThat(resp.errors()).hasSize(1);
        assertThat(resp.errors().get(0).field()).isEqualTo("ccidSegment4");
    }

    @Test
    @DisplayName("empty segments list → valid=false, all 12 errors")
    void validate_emptyList_returns12Errors() {
        ValidateCcidUseCase.CcidValidateResponse resp =
                useCase.validate(new ValidateCcidUseCase.CcidValidateRequest(List.of(), null));

        assertThat(resp.valid()).isFalse();
        assertThat(resp.errors()).hasSize(12);
    }
}
