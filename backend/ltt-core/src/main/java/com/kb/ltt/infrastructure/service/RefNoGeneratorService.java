package com.kb.ltt.infrastructure.service;

import com.kb.ltt.infrastructure.persistence.entity.RefNoSequenceEntity;
import com.kb.ltt.infrastructure.persistence.entity.RefNoSequenceId;
import com.kb.ltt.infrastructure.persistence.repository.RefNoSequenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Generates REF_NO values using the pattern: {@code <kbnnId>-YYYYMM-<seq6padded>}
 * e.g. {@code HN001-202605-000001}.
 *
 * <p>Concurrency safety: uses PESSIMISTIC_WRITE row lock on LTT_REF_NO_SEQUENCE
 * to serialize sequence increments within the same (KBNN, YYYYMM) bucket.</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RefNoGeneratorService {

    private static final DateTimeFormatter YEAR_MONTH_FMT =
            DateTimeFormatter.ofPattern("yyyyMM").withZone(ZoneOffset.UTC);

    private final RefNoSequenceRepository refNoSequenceRepository;

    /**
     * Generate the next REF_NO for the given KBNN ID using the current UTC year-month.
     *
     * @param kbnnId KBNN tenant identifier (e.g. "HN001")
     * @return formatted REF_NO like {@code HN001-202605-000001}
     * @throws IllegalStateException if the monthly sequence exceeds 999999
     */
    @Transactional
    public String generate(String kbnnId) {
        String yearMonth = YEAR_MONTH_FMT.format(Instant.now());
        return generateForYearMonth(kbnnId, yearMonth);
    }

    /**
     * Generate a REF_NO for a specific year-month.
     * Exposed for testing.
     */
    @Transactional
    public String generateForYearMonth(String kbnnId, String yearMonth) {
        RefNoSequenceEntity seq = refNoSequenceRepository
                .findByKbnnIdAndYearMonthWithLock(kbnnId, yearMonth)
                .orElseGet(() -> {
                    RefNoSequenceEntity newSeq = RefNoSequenceEntity.builder()
                            .id(RefNoSequenceId.builder()
                                    .kbnnId(kbnnId)
                                    .yearMonth(yearMonth)
                                    .build())
                            .lastSeq(0L)
                            .updatedAt(Instant.now())
                            .build();
                    return refNoSequenceRepository.save(newSeq);
                });

        long nextSeq = seq.getLastSeq() + 1;
        if (nextSeq > 999_999) {
            throw new IllegalStateException(
                    "REF_NO sequence overflow for kbnnId=" + kbnnId + " yearMonth=" + yearMonth);
        }

        seq.setLastSeq(nextSeq);
        seq.setUpdatedAt(Instant.now());
        refNoSequenceRepository.save(seq);

        String refNo = String.format("%s-%s-%06d", kbnnId, yearMonth, nextSeq);
        log.debug("Generated REF_NO: {}", refNo);
        return refNo;
    }
}
