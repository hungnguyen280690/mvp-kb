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

import java.time.LocalDate;

/**
 * LTT Receiver entity - stores receiver information for a Payment Order.
 * Mapped to LTT_RECEIVER table in Oracle.
 *
 * // FT-001: LTT Receiver information
 */
@Entity
@Table(name = "LTT_RECEIVER")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttReceiver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "LTT_ID", nullable = false)
    private Long lttId;

    @Column(name = "RECEIVER_NAME", nullable = false, length = 200)
    private String receiverName;

    @Column(name = "RECEIVER_ADDRESS", length = 300)
    private String receiverAddress;

    @Column(name = "RECEIVER_GL_SEGMENT2", length = 4)
    private String receiverGlSegment2;

    @Column(name = "RECEIVER_BANK_NAME", nullable = false, length = 200)
    private String receiverBankName;

    @Column(name = "RECEIVER_BANK_CODE", nullable = false, length = 20)
    private String receiverBankCode;

    // Rule 5.2: PII field - requires masking for non-VIEW_PII roles
    @Column(name = "RECEIVER_IDENTIFY_ID", length = 30)
    private String receiverIdentifyId;

    @Column(name = "RECEIVER_ISSUED_DATE")
    private LocalDate receiverIssuedDate;

    @Column(name = "RECEIVER_ISSUED_PLACE", length = 200)
    private String receiverIssuedPlace;
}
