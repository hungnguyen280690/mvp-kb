package com.kb.ltt.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity mapping LTT_PAY_ORDER.
 * Infrastructure layer — isolated from the domain model.
 */
@Entity
@Table(name = "LTT_PAY_ORDER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOrderEntity {

    @Id
    @Column(name = "ID", length = 36)
    private String id;

    @Version
    @Column(name = "VERSION")
    private Long version;

    @Column(name = "STATUS", length = 30, nullable = false)
    private String status;

    @Column(name = "REF_NO", length = 20, nullable = false)
    private String refNo;

    @Column(name = "CHANNEL", length = 30, nullable = false)
    private String channel;

    @Column(name = "ORDER_TYPE", length = 30)
    private String orderType;

    @Column(name = "LNH_TRANSACTION_TYPE", length = 10)
    private String lnhTransactionType;

    @Column(name = "SENDER", length = 20, nullable = false)
    private String sender;

    @Column(name = "RECEIVER", length = 20, nullable = false)
    private String receiver;

    @Column(name = "PAYMENT_DATE")
    private LocalDate paymentDate;

    @Column(name = "AMOUNT", precision = 18, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "CURRENCY_CODE", length = 3, nullable = false)
    private String currencyCode;

    @Column(name = "EXCHANGE_RATE", precision = 18, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "ORIGIN_NUM", length = 50)
    private String originNum;

    @Column(name = "TRANSACTION_DATE")
    private LocalDate transactionDate;

    @Column(name = "EXP_TYPE", length = 10)
    private String expType;

    @Column(name = "FN_CODE1", length = 3)
    private String fnCode1;

    @Column(name = "FN_CODE2", length = 3)
    private String fnCode2;

    @Column(name = "FN_AMOUNT", precision = 18, scale = 2)
    private BigDecimal fnAmount;

    @Column(name = "DESCRIPTION", length = 500, nullable = false)
    private String description;

    // ── Sender tab ─────────────────────────────────────────────────────────
    @Column(name = "SENDER_NAME", length = 200, nullable = false)
    private String senderName;

    @Column(name = "SENDER_ADDRESS", length = 500, nullable = false)
    private String senderAddress;

    @Column(name = "SENDER_GL_SEGMENT2", length = 4, nullable = false)
    private String senderGlSegment2;

    @Column(name = "SENDER_NUM", length = 20)
    private String senderNum;

    @Column(name = "SENDER_BANK_CODE", length = 20, nullable = false)
    private String senderBankCode;

    @Column(name = "SENDER_IDENTIFY_ID", length = 50)
    private String senderIdentifyId;

    @Column(name = "SENDER_ISSUED_DATE")
    private LocalDate senderIssuedDate;

    @Column(name = "SENDER_ISSUED_PLACE", length = 200)
    private String senderIssuedPlace;

    @Column(name = "TPCP_CODE", length = 20)
    private String tpcpCode;

    // ── Receiver tab ───────────────────────────────────────────────────────
    @Column(name = "RECEIVER_NAME", length = 200, nullable = false)
    private String receiverName;

    @Column(name = "RECEIVER_ADDRESS", length = 500)
    private String receiverAddress;

    @Column(name = "RECEIVER_GL_SEGMENT2", length = 20, nullable = false)
    private String receiverGlSegment2;

    @Column(name = "RECEIVER_BANK_CODE", length = 20, nullable = false)
    private String receiverBankCode;

    @Column(name = "RECEIVER_ACCOUNT_NAME", length = 200, nullable = false)
    private String receiverAccountName;

    @Column(name = "RECEIVER_IDENTIFY_ID", length = 50)
    private String receiverIdentifyId;

    @Column(name = "RECEIVER_ISSUED_DATE")
    private LocalDate receiverIssuedDate;

    @Column(name = "RECEIVER_ISSUED_PLACE", length = 200)
    private String receiverIssuedPlace;

    // ── Workflow attribution ────────────────────────────────────────────────
    @Column(name = "KBNN_ID", length = 10, nullable = false)
    private String kbnnId;

    @Column(name = "CREATED_BY", length = 36, nullable = false)
    private String createdBy;

    @Column(name = "CREATED_AT")
    private Instant createdAt;

    @Column(name = "CREATED_IP", length = 45)
    private String createdIp;

    @Column(name = "UPDATED_BY", length = 36)
    private String updatedBy;

    @Column(name = "UPDATED_AT")
    private Instant updatedAt;

    @Column(name = "UPDATED_IP", length = 45)
    private String updatedIp;

    @Column(name = "CHECKER_ID", length = 36)
    private String checkerId;

    @Column(name = "CHECKER_ACTION_AT")
    private Instant checkerActionAt;

    @Column(name = "CHECKER_COMMENT", length = 500)
    private String checkerComment;

    @Column(name = "APPROVER_ID", length = 36)
    private String approverId;

    @Column(name = "APPROVER_ACTION_AT")
    private Instant approverActionAt;

    @Column(name = "APPROVER_COMMENT", length = 500)
    private String approverComment;

    // ── Soft delete ────────────────────────────────────────────────────────
    @Column(name = "DELETE_REASON", length = 500)
    private String deleteReason;

    @Column(name = "DELETED_BY", length = 36)
    private String deletedBy;

    @Column(name = "DELETED_AT")
    private Instant deletedAt;

    @Column(name = "DELETED_IP", length = 45)
    private String deletedIp;

    @Column(name = "IDEMPOTENCY_KEY", length = 64)
    private String idempotencyKey;

    // ── Relationships ──────────────────────────────────────────────────────
    @OneToMany(mappedBy = "orderId", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<PayOrderLineEntity> lines = new ArrayList<>();

    @OneToMany(mappedBy = "orderId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PayOrderAttachmentEntity> attachments = new ArrayList<>();
}
