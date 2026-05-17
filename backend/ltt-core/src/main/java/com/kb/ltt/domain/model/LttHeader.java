package com.kb.ltt.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * LTT Header entity - core transaction record for Lenh Thanh Toan (Payment Order).
 * Mapped to LTT_HEADER table in Oracle.
 *
 * Uses optimistic locking via fVer column (Rule 3.4: Fail Fast).
 * Supports soft-delete via fStatus = DELETED (BIZ-003).
 * Idempotency enforced via idempotencyKey unique constraint (Rule 2.3).
 *
 * // FT-001: LTT Header entity
 * // BIZ-007: Audit trail fields (createdBy, createdDate, checkedBy, etc.)
 * // BIZ-008: Transaction history fields
 */
@Entity
@Table(name = "LTT_HEADER")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttHeader {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "F_ID")
    private Long fId;

    @Column(name = "REF_NO", nullable = false, length = 50)
    private String refNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "CHANNEL", nullable = false, length = 10)
    private LttChannel channel;

    @Column(name = "TRANSACTION_TYPE", nullable = false, length = 50)
    private String transactionType;

    @Column(name = "LNH_TRANSACTION_TYPE", length = 50)
    private String lnhTransactionType;

    @Column(name = "SENDER_CODE", nullable = false, length = 20)
    private String senderCode;

    @Column(name = "RECEIVER_CODE", nullable = false, length = 20)
    private String receiverCode;

    @Column(name = "PAYMENT_DATE", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "AMOUNT", nullable = false, precision = 20, scale = 2)
    private BigDecimal amount;

    @Column(name = "CURRENCY_CODE", nullable = false, length = 3)
    private String currencyCode;

    @Column(name = "EXCHANGE_RATE", precision = 18, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "ORIGIN_NUM", length = 50)
    private String originNum;

    @Column(name = "TRANSACTION_DATE")
    private LocalDate transactionDate;

    @Column(name = "EXP_TYPE", length = 30)
    private String expType;

    @Column(name = "FN_CODE1", length = 10)
    private String fnCode1;

    @Column(name = "FN_CODE2", length = 10)
    private String fnCode2;

    @Column(name = "FN_AMOUNT", precision = 20, scale = 2)
    private BigDecimal fnAmount;

    @Column(name = "DESCRIPTION", nullable = false, length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "F_STATUS", nullable = false, length = 30)
    private LttStatus fStatus;

    @Version
    @Column(name = "F_VER", nullable = false)
    private Integer fVer;

    // BIZ-007, BIZ-008: Audit trail fields
    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "CHECKED_BY", length = 50)
    private String checkedBy;

    @Column(name = "CHECKED_DATE")
    private LocalDateTime checkedDate;

    @Column(name = "APPROVED_BY", length = 50)
    private String approvedBy;

    @Column(name = "APPROVED_DATE")
    private LocalDateTime approvedDate;

    @Column(name = "DELETED_BY", length = 50)
    private String deletedBy;

    @Column(name = "DELETED_DATE")
    private LocalDateTime deletedDate;

    @Column(name = "DELETE_REASON", length = 500)
    private String deleteReason;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    // Rule 2.3: Idempotency key for preventing duplicate requests
    @Column(name = "IDEMPOTENCY_KEY", unique = true, length = 100)
    private String idempotencyKey;
}
