package com.kb.ltt.infrastructure.service;

import com.kb.ltt.infrastructure.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for RefNoGeneratorService using H2 in-memory DB.
 */
@DisplayName("RefNoGeneratorService — integration")
class RefNoGeneratorServiceTest extends BaseIntegrationTest {

    @Autowired
    RefNoGeneratorService refNoGeneratorService;

    @Test
    @DisplayName("generate returns format <kbnnId>-YYYYMM-000001 on first call")
    void generate_firstCall_formatsCorrectly() {
        String yearMonth = java.time.format.DateTimeFormatter
                .ofPattern("yyyyMM")
                .withZone(java.time.ZoneOffset.UTC)
                .format(java.time.Instant.now());

        String refNo = refNoGeneratorService.generateForYearMonth("HN001", yearMonth);

        assertThat(refNo).matches("HN001-\\d{6}-\\d{6}");
        assertThat(refNo).endsWith("-000001");
        assertThat(refNo).startsWith("HN001-" + yearMonth + "-");
    }

    @Test
    @DisplayName("calling twice increments the sequence")
    void generate_calledTwice_incrementsSequence() {
        String ym = "202601"; // fixed month for isolation

        String first  = refNoGeneratorService.generateForYearMonth("HN002", ym);
        String second = refNoGeneratorService.generateForYearMonth("HN002", ym);

        assertThat(first).endsWith("-000001");
        assertThat(second).endsWith("-000002");
    }

    @Test
    @DisplayName("different kbnnId gets its own independent sequence")
    void generate_differentKbnnId_hasOwnSequence() {
        String ym = "202602"; // fixed month for isolation

        String refA = refNoGeneratorService.generateForYearMonth("KBNN_A", ym);
        String refB = refNoGeneratorService.generateForYearMonth("KBNN_B", ym);

        // Both start at 1 — independent counters
        assertThat(refA).endsWith("-000001");
        assertThat(refB).endsWith("-000001");
        assertThat(refA).startsWith("KBNN_A-");
        assertThat(refB).startsWith("KBNN_B-");
    }
}
