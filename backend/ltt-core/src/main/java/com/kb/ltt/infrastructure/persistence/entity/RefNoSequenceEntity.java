package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.OffsetDateTime;

/**
 * JPA Entity: LTT_REF_NO_SEQUENCE - Sequence per (KBNN, YYYYMM).
 * Tuong ung table LTT_REF_NO_SEQUENCE trong 03-schema.sql.
 * INC-G-02.
 */
@Entity
@Table(name = "LTT_REF_NO_SEQUENCE")
@IdClass(RefNoSequenceEntity.RefNoSequenceId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefNoSequenceEntity {

    @Id
    @Column(name = "KBNN_ID", length = 10, nullable = false)
    private String kbnnId;

    @Id
    @Column(name = "YEAR_MONTH", length = 6, nullable = false)
    private String yearMonth;

    @Column(name = "LAST_SEQ", nullable = false)
    @Builder.Default
    private Long lastSeq = 0L;

    @Column(name = "UPDATED_AT", nullable = false)
    private OffsetDateTime updatedAt;

    /**
     * Composite primary key for RefNoSequenceEntity.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class RefNoSequenceId implements Serializable {
        private String kbnnId;
        private String yearMonth;
    }
}
