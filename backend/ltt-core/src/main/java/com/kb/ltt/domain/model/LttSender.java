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
 * LTT Sender entity - stores sender information for a Payment Order.
 * Mapped to LTT_SENDER table in Oracle.
 *
 * // FT-001: LTT Sender information
 */
@Entity
@Table(name = "LTT_SENDER")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttSender {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "LTT_ID", nullable = false)
    private Long lttId;

    @Column(name = "SENDER_NAME", nullable = false, length = 200)
    private String senderName;

    @Column(name = "SENDER_ADDRESS", length = 300)
    private String senderAddress;

    @Column(name = "SENDER_GL_SEGMENT2", length = 4)
    private String senderGlSegment2;

    @Column(name = "SENDER_NUM", length = 20)
    private String senderNum;

    @Column(name = "SENDER_BANK_CODE", nullable = false, length = 20)
    private String senderBankCode;

    // Rule 5.2: PII field - requires masking for non-VIEW_PII roles
    @Column(name = "SENDER_IDENTIFY_ID", length = 30)
    private String senderIdentifyId;

    @Column(name = "SENDER_ISSUED_DATE")
    private LocalDate senderIssuedDate;

    @Column(name = "SENDER_ISSUED_PLACE", length = 200)
    private String senderIssuedPlace;

    // Only required when Transaction Type = "Lệnh trái phiếu chính phủ"
    @Column(name = "TPCP_CODE", length = 20)
    private String tpcpCode;
}
