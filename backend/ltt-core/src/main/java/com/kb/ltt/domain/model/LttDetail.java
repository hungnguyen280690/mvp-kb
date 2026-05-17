package com.kb.ltt.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * LTT Detail entity - represents a single COA (Chart of Accounts) line item.
 * Each LTT Header has one or more Detail lines.
 * Mapped to LTT_DETAIL table in Oracle.
 *
 * BIZ-004: Sum of all detail amounts must equal LttHeader.amount.
 * All GL_Segment fields participate in CCID cross-validation.
 *
 * // FT-001: LTT Detail line entity
 */
@Entity
@Table(name = "LTT_DETAIL")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "LTT_ID", nullable = false)
    private Long lttId;

    @Column(name = "LINE_NO", nullable = false)
    private Integer lineNo;

    // COA Segments 1-12 (CCID cross-validation)
    @Column(name = "GL_SEGMENT1", length = 2)
    private String glSegment1;

    @Column(name = "GL_SEGMENT2", nullable = false, length = 4)
    private String glSegment2;

    @Column(name = "GL_SEGMENT3", nullable = false, length = 7)
    private String glSegment3;

    @Column(name = "GL_SEGMENT4", length = 10)
    private String glSegment4;

    @Column(name = "GL_SEGMENT5", length = 3)
    private String glSegment5;

    @Column(name = "GL_SEGMENT6", length = 3)
    private String glSegment6;

    @Column(name = "GL_SEGMENT7", length = 4)
    private String glSegment7;

    @Column(name = "GL_SEGMENT8", length = 5)
    private String glSegment8;

    @Column(name = "GL_SEGMENT9", length = 5)
    private String glSegment9;

    @Column(name = "GL_SEGMENT10", length = 2)
    private String glSegment10;

    @Column(name = "GL_SEGMENT11", length = 4)
    private String glSegment11;

    @Column(name = "GL_SEGMENT12", length = 3)
    private String glSegment12;

    @Column(name = "DESCRIPTION", nullable = false, length = 500)
    private String description;

    @Column(name = "AMOUNT", nullable = false, precision = 20, scale = 2)
    private BigDecimal amount;
}
