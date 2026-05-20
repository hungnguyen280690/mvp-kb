package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * JPA entity mapping LTT_REF_NO_SEQUENCE.
 * Holds the per-(KBNN, YYYYMM) atomic counter used to generate REF_NO.
 * Row-level locking (PESSIMISTIC_WRITE) is applied at repository level.
 */
@Entity
@Table(name = "LTT_REF_NO_SEQUENCE")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefNoSequenceEntity {

    @EmbeddedId
    private RefNoSequenceId id;

    /** Last used sequence value. 0 means no REF_NO generated yet this month. */
    @Column(name = "LAST_SEQ", nullable = false)
    private Long lastSeq;

    @Column(name = "UPDATED_AT")
    private Instant updatedAt;
}
