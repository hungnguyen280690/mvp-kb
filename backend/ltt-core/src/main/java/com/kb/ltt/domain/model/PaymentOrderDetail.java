package com.kb.ltt.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_order_detail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_order_id", nullable = false)
    private PaymentOrder paymentOrder;

    @Column(name = "line_no", nullable = false)
    private Integer lineNo;

    @Column(name = "gl_segment1", length = 2)
    @Builder.Default
    private String glSegment1 = "01";

    @Column(name = "gl_segment2", nullable = false, length = 4)
    private String glSegment2;

    @Column(name = "gl_segment3", nullable = false, length = 7)
    private String glSegment3;

    @Column(name = "gl_segment4", length = 10)
    private String glSegment4;

    @Column(name = "gl_segment5", length = 3)
    @Builder.Default
    private String glSegment5 = "000";

    @Column(name = "gl_segment6", length = 3)
    @Builder.Default
    private String glSegment6 = "000";

    @Column(name = "gl_segment7", length = 4)
    @Builder.Default
    private String glSegment7 = "0000";

    @Column(name = "gl_segment8", length = 5)
    @Builder.Default
    private String glSegment8 = "00000";

    @Column(name = "gl_segment9", length = 5)
    @Builder.Default
    private String glSegment9 = "00000";

    @Column(name = "gl_segment10", length = 2)
    @Builder.Default
    private String glSegment10 = "00";

    @Column(name = "gl_segment11", length = 4)
    @Builder.Default
    private String glSegment11 = "0000";

    @Column(name = "gl_segment12", length = 3)
    @Builder.Default
    private String glSegment12 = "00";

    @Column(name = "line_description", nullable = false, length = 500)
    private String lineDescription;

    @Column(name = "line_amount", nullable = false, precision = 22, scale = 2)
    private BigDecimal lineAmount;

    @Column(name = "created_by", nullable = false, length = 40)
    private String createdBy;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "last_updated_by", length = 40)
    private String lastUpdatedBy;

    @Column(name = "last_updated_date")
    private LocalDateTime lastUpdatedDate;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdatedDate = LocalDateTime.now();
    }
}
