package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * JPA Entity: LTT_PAY_ORDER_LINE - Chi tiet khoan muc COA (12 segments).
 * Tuong ung table LTT_PAY_ORDER_LINE trong 03-schema.sql.
 */
@Entity
@Table(name = "LTT_PAY_ORDER_LINE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOrderLineEntity {

    @Id
    @Column(name = "ID", length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ORDER_ID", nullable = false, foreignKey = @ForeignKey(name = "FK_LTT_PAY_ORDER_LINE_ORDER"))
    private PayOrderEntity order;

    @Column(name = "LINE_NO", nullable = false)
    private Integer lineNo;

    // 12 COA segments
    @Column(name = "GL_SEGMENT1", length = 2)
    @Builder.Default
    private String glSegment1 = "01";

    @Column(name = "GL_SEGMENT2", length = 4, nullable = false)
    private String glSegment2;

    @Column(name = "GL_SEGMENT3", length = 7, nullable = false)
    private String glSegment3;

    @Column(name = "GL_SEGMENT4", length = 1)
    private String glSegment4;

    @Column(name = "GL_SEGMENT5", length = 3)
    @Builder.Default
    private String glSegment5 = "000";

    @Column(name = "GL_SEGMENT6", length = 3)
    @Builder.Default
    private String glSegment6 = "000";

    @Column(name = "GL_SEGMENT7", length = 4)
    @Builder.Default
    private String glSegment7 = "0000";

    @Column(name = "GL_SEGMENT8", length = 5)
    @Builder.Default
    private String glSegment8 = "00000";

    @Column(name = "GL_SEGMENT9", length = 5)
    @Builder.Default
    private String glSegment9 = "00000";

    @Column(name = "GL_SEGMENT10", length = 2)
    @Builder.Default
    private String glSegment10 = "00";

    @Column(name = "GL_SEGMENT11", length = 4)
    @Builder.Default
    private String glSegment11 = "0000";

    @Column(name = "GL_SEGMENT12", length = 3)
    @Builder.Default
    private String glSegment12 = "000";

    @Column(name = "CCID_KEY", length = 50)
    private String ccidKey;

    @Column(name = "LINE_DESCRIPTION", length = 500, nullable = false)
    private String lineDescription;

    @Column(name = "LINE_AMOUNT", precision = 18, scale = 2, nullable = false)
    private BigDecimal lineAmount;

    @Column(name = "CREATED_AT", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private OffsetDateTime updatedAt;
}
