package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

/**
 * Composite primary key for LTT_REF_NO_SEQUENCE (kbnnId + yearMonth).
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefNoSequenceId implements Serializable {

    @Column(name = "KBNN_ID", length = 10)
    private String kbnnId;

    /** Format: YYYYMM */
    @Column(name = "YEAR_MONTH", length = 6)
    private String yearMonth;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RefNoSequenceId that)) return false;
        return Objects.equals(kbnnId, that.kbnnId)
                && Objects.equals(yearMonth, that.yearMonth);
    }

    @Override
    public int hashCode() {
        return Objects.hash(kbnnId, yearMonth);
    }
}
