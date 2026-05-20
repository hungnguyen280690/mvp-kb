package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * JPA entity mapping LTT_PAY_ORDER_LINE.
 * orderId is a plain String FK field (no @ManyToOne) to keep Hexagonal boundary clean.
 */
@Entity
@Table(name = "LTT_PAY_ORDER_LINE")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderLineEntity {

    @Id
    @Column(name = "ID", length = 36)
    private String id;

    /**
     * Plain FK string — used as mappedBy target in PayOrderEntity.
     * No @ManyToOne to avoid cross-aggregate navigation.
     */
    @Column(name = "ORDER_ID", length = 36, nullable = false, insertable = true, updatable = false)
    private String orderId;

    @Column(name = "LINE_NO")
    private Integer lineNum;

    @Column(name = "LINE_AMOUNT", precision = 18, scale = 2)
    private BigDecimal lineAmount;

    @Column(name = "LINE_DESCRIPTION", length = 500)
    private String lineDescription;

    // ── 12 COA segments ───────────────────────────────────────────────────
    @Column(name = "GL_SEGMENT1", length = 2)
    private String ccidSegment1;

    @Column(name = "GL_SEGMENT2", length = 4)
    private String ccidSegment2;

    @Column(name = "GL_SEGMENT3", length = 7)
    private String ccidSegment3;

    @Column(name = "GL_SEGMENT4", length = 1)
    private String ccidSegment4;

    @Column(name = "GL_SEGMENT5", length = 3)
    private String ccidSegment5;

    @Column(name = "GL_SEGMENT6", length = 3)
    private String ccidSegment6;

    @Column(name = "GL_SEGMENT7", length = 4)
    private String ccidSegment7;

    @Column(name = "GL_SEGMENT8", length = 5)
    private String ccidSegment8;

    @Column(name = "GL_SEGMENT9", length = 5)
    private String ccidSegment9;

    @Column(name = "GL_SEGMENT10", length = 2)
    private String ccidSegment10;

    @Column(name = "GL_SEGMENT11", length = 4)
    private String ccidSegment11;

    @Column(name = "GL_SEGMENT12", length = 3)
    private String ccidSegment12;

    @Column(name = "CCID_KEY", length = 50)
    private String ccidKey;

    @Column(name = "CREATED_AT")
    private Instant createdAt;

    @Column(name = "UPDATED_AT")
    private Instant updatedAt;
}
