package vn.gov.kbnn.vdbas.ltt.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * JPA entity cho bang LTT_SIGNATURE — chu ky so.
 */
@Entity
@Table(name = "LTT_SIGNATURE")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttSignature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "LTT_ID", nullable = false)
    private Ltt ltt;

    @Column(name = "SIGNER_ID", nullable = false, length = 50)
    private String signerId;

    @Column(name = "SIGNER_NAME", length = 200)
    private String signerName;

    @Column(name = "SIGNER_ROLE", nullable = false, length = 20)
    private String signerRole;

    @Column(name = "SIGN_TYPE", nullable = false, length = 10)
    @Builder.Default
    private String signType = "DIGITAL";

    @Column(name = "SIGNATURE_DATA", columnDefinition = "CLOB")
    private String signatureData;

    @Column(name = "CERTIFICATE_SERIAL", length = 100)
    private String certificateSerial;

    @Column(name = "SIGNED_AT", nullable = false)
    private OffsetDateTime signedAt;

    @Column(name = "CONTENT_HASH", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "SIGN_STATUS", nullable = false, length = 10)
    @Builder.Default
    private String signStatus = "VALID";

    @Column(name = "ECM_DOC_ID", length = 100)
    private String ecmDocId;
}
