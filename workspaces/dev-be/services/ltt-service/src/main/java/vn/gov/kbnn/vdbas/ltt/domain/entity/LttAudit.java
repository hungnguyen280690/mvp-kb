package vn.gov.kbnn.vdbas.ltt.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * JPA entity cho bang LTT_AUDIT — nhat ky kiem toan.
 */
@Entity
@Table(name = "LTT_AUDIT")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "LTT_ID", nullable = false)
    private Long lttId;

    @Column(name = "ACTION", nullable = false, length = 30)
    private String action;

    @Column(name = "STATE_FROM", length = 25)
    private String stateFrom;

    @Column(name = "STATE_TO", length = 25)
    private String stateTo;

    @Column(name = "PERFORMED_BY", nullable = false, length = 50)
    private String performedBy;

    @Column(name = "PERFORMED_BY_NAME", length = 200)
    private String performedByName;

    @Column(name = "PERFORMED_AT", nullable = false)
    private OffsetDateTime performedAt;

    @Column(name = "IP_ADDRESS", length = 45)
    private String ipAddress;

    @Column(name = "VERSION_FROM")
    private Long versionFrom;

    @Column(name = "VERSION_TO")
    private Long versionTo;

    @Column(name = "FIELD_DIFFS", columnDefinition = "CLOB")
    private String fieldDiffs;

    @Column(name = "REASON", length = 500)
    private String reason;

    @Column(name = "METADATA", columnDefinition = "CLOB")
    private String metadata;
}
