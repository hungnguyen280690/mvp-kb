package vn.gov.kbnn.vdbas.audit.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * JPA entity cho bang AUDIT_HASH — chuoi hash kiem toan (ADR-0003).
 * Moi thao tac LTT ghi 1 dong, hash_truoc + du lieu + thoi_gian -> SHA-256.
 */
@Entity
@Table(name = "AUDIT_HASH")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditHash {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "LTT_ID", nullable = false)
    private Long lttId;

    @Column(name = "AUDIT_ID", nullable = false)
    private Long auditId;

    @Column(name = "PREVIOUS_HASH", length = 64)
    private String previousHash;

    @Column(name = "CURRENT_HASH", nullable = false, length = 64)
    private String currentHash;

    @Column(name = "HASH_ALGORITHM", nullable = false, length = 10)
    @Builder.Default
    private String hashAlgorithm = "SHA-256";

    @Column(name = "CREATED_AT", nullable = false)
    private OffsetDateTime createdAt;
}
