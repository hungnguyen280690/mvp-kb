package vn.gov.kbnn.vdbas.ltt.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * JPA entity cho bang LTT_LINE_ITEM — chi tiet khoan muc COA.
 */
@Entity
@Table(name = "LTT_LINE_ITEM")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "LTT_ID", nullable = false)
    private Ltt ltt;

    @Column(name = "LINE_NO", nullable = false)
    private Integer lineNo;

    // 11 COA segments
    @Column(name = "COA_FUND", length = 2)
    @Builder.Default
    private String coaFund = "01";

    @Column(name = "COA_NATURAL_ACCOUNT", length = 4)
    private String coaNaturalAccount;

    @Column(name = "COA_DVQHNS", length = 7)
    private String coaDvqhns;

    @Column(name = "COA_BUDGET_LEVEL", length = 1)
    private String coaBudgetLevel;

    @Column(name = "COA_CHAPTER", length = 3)
    @Builder.Default
    private String coaChapter = "000";

    @Column(name = "COA_INDUSTRY", length = 3)
    @Builder.Default
    private String coaIndustry = "000";

    @Column(name = "COA_NDKT", length = 4)
    @Builder.Default
    private String coaNdkt = "0000";

    @Column(name = "COA_AREA", length = 5)
    @Builder.Default
    private String coaArea = "00000";

    @Column(name = "COA_PROGRAM", length = 5)
    @Builder.Default
    private String coaProgram = "00000";

    @Column(name = "COA_FUND_SOURCE", length = 2)
    @Builder.Default
    private String coaFundSource = "00";

    @Column(name = "COA_TREASURY", length = 4)
    @Builder.Default
    private String coaTreasury = "0000";

    @Column(name = "COA_RESERVE", length = 3)
    @Builder.Default
    private String coaReserve = "000";

    @Column(name = "DESCRIPTION", nullable = false, length = 250)
    private String description;

    @Column(name = "LINE_AMOUNT", nullable = false, precision = 18, scale = 2)
    private BigDecimal lineAmount;

    // Audit
    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_AT", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_AT")
    private OffsetDateTime updatedAt;
}
