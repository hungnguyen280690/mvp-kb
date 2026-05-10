package vn.gov.kbnn.vdbas.ltt.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity cho bang LTT — ban ghi chinh.
 * Mapping tu V1__init_ltt.sql (57+ columns).
 */
@Entity
@Table(name = "LTT")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ltt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    // === Dinh danh ===
    @Column(name = "SO_YCTT", nullable = false, length = 30)
    private String soYctt;

    @Column(name = "IDEMPOTENCY_KEY", length = 64, unique = true)
    private String idempotencyKey;

    // === Trang thai ===
    @Column(name = "STATE", nullable = false, length = 25)
    private String state;

    @Column(name = "PREV_STATE", length = 25)
    private String prevState;

    // === Nhom 1: Thong tin chung ===
    @Column(name = "CHANNEL", nullable = false, length = 5)
    private String channel;

    @Column(name = "ORDER_TYPE", nullable = false, length = 12)
    private String orderType;

    @Column(name = "SENDER_BANK_CODE", nullable = false, length = 8)
    private String senderBankCode;

    @Column(name = "RECEIVER_BANK_CODE", nullable = false, length = 8)
    private String receiverBankCode;

    @Column(name = "PAYMENT_DATE", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "AMOUNT", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "CURRENCY", nullable = false, length = 3)
    @Builder.Default
    private String currency = "VND";

    @Column(name = "TXN_TYPE", length = 6)
    private String txnType;

    @Column(name = "EXCHANGE_RATE", precision = 12, scale = 5)
    private BigDecimal exchangeRate;

    @Column(name = "ORIG_DOC_NO", length = 30)
    private String origDocNo;

    @Column(name = "ORIG_DOC_DATE")
    private LocalDate origDocDate;

    @Column(name = "FEE_TYPE", length = 8)
    private String feeType;

    @Column(name = "DEBIT_CCY", length = 3)
    private String debitCcy;

    @Column(name = "PAYMENT_CCY", length = 3)
    private String paymentCcy;

    @Column(name = "PAYMENT_CCY_AMOUNT", precision = 18, scale = 2)
    private BigDecimal paymentCcyAmount;

    @Column(name = "PAYMENT_CONTENT", nullable = false, length = 500)
    private String paymentContent;

    @Column(name = "TPCP_CODE", length = 20)
    private String tpcpCode;

    // === Nhom 2: COA Segments (to hop chinh) ===
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

    // === Nhom 3: Nguoi chuyen ===
    @Column(name = "SENDER_NAME", nullable = false, length = 200)
    private String senderName;

    @Column(name = "SENDER_ADDRESS", length = 250)
    private String senderAddress;

    @Column(name = "SENDER_ACCOUNT", length = 25)
    private String senderAccount;

    @Column(name = "SENDER_CUSTOMER_CODE", length = 20)
    private String senderCustomerCode;

    @Column(name = "SENDER_BANK_NAME", length = 200)
    private String senderBankName;

    @Column(name = "SENDER_ID_NUMBER", length = 20)
    private String senderIdNumber;

    @Column(name = "SENDER_ID_ISSUE_DATE")
    private LocalDate senderIdIssueDate;

    @Column(name = "SENDER_ID_ISSUE_PLACE", length = 100)
    private String senderIdIssuePlace;

    // === Nhom 4: Nguoi nhan ===
    @Column(name = "RECEIVER_NAME", nullable = false, length = 200)
    private String receiverName;

    @Column(name = "RECEIVER_ADDRESS", length = 250)
    private String receiverAddress;

    @Column(name = "RECEIVER_ACCOUNT", length = 25)
    private String receiverAccount;

    @Column(name = "RECEIVER_BANK_NAME", length = 200)
    private String receiverBankName;

    @Column(name = "RECEIVER_ACCOUNT_NAME", length = 200)
    private String receiverAccountName;

    @Column(name = "RECEIVER_ID_NUMBER", length = 20)
    private String receiverIdNumber;

    @Column(name = "RECEIVER_ID_ISSUE_DATE")
    private LocalDate receiverIdIssueDate;

    @Column(name = "RECEIVER_ID_ISSUE_PLACE", length = 100)
    private String receiverIdIssuePlace;

    // === Nhom 5: Workflow ===
    @Column(name = "MAKER_ID", nullable = false, length = 50)
    private String makerId;

    @Column(name = "MAKER_NAME", length = 200)
    private String makerName;

    @Column(name = "CHECKER_ID", length = 50)
    private String checkerId;

    @Column(name = "CHECKER_NAME", length = 200)
    private String checkerName;

    @Column(name = "APPROVER_ID", length = 50)
    private String approverId;

    @Column(name = "APPROVER_NAME", length = 200)
    private String approverName;

    @Column(name = "CHECKED_AT")
    private OffsetDateTime checkedAt;

    @Column(name = "APPROVED_AT")
    private OffsetDateTime approvedAt;

    @Column(name = "REJECT_REASON", length = 500)
    private String rejectReason;

    @Column(name = "REJECTED_BY", length = 50)
    private String rejectedBy;

    @Column(name = "REJECTED_AT")
    private OffsetDateTime rejectedAt;

    @Column(name = "CANCEL_REASON", length = 500)
    private String cancelReason;

    @Column(name = "CANCELLED_BY", length = 50)
    private String cancelledBy;

    @Column(name = "CANCELLED_AT")
    private OffsetDateTime cancelledAt;

    // === Nhom 6: Tich hop ===
    @Column(name = "UNIT_CODE", nullable = false, length = 10)
    private String unitCode;

    @Column(name = "WORKING_DATE", nullable = false)
    private LocalDate workingDate;

    @Column(name = "GL_VOUCHER_NO", length = 30)
    private String glVoucherNo;

    @Column(name = "EXT_REFERENCE", length = 50)
    private String extReference;

    @Column(name = "REVERSAL_OF_ID")
    private Long reversalOfId;

    @Column(name = "SEND_RETRY_COUNT")
    @Builder.Default
    private Integer sendRetryCount = 0;

    @Column(name = "CORRELATION_ID", length = 64)
    private String correlationId;

    // === Nhom 7: Soft-delete ===
    @Column(name = "IS_DELETED", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "DELETED_BY", length = 50)
    private String deletedBy;

    @Column(name = "DELETED_AT")
    private OffsetDateTime deletedAt;

    @Column(name = "DELETE_REASON", length = 500)
    private String deleteReason;

    // === Nhom 8: Optimistic lock ===
    @Column(name = "VERSION", nullable = false)
    @Version
    @Builder.Default
    private Long version = 1L;

    // === Nhom 9: Audit ===
    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_AT", nullable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_AT")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    @Column(name = "LAST_IP_ADDRESS", length = 45)
    private String lastIpAddress;

    // === Nhom 10: Metadata ===
    @Column(name = "SOURCE_TYPE", length = 10)
    @Builder.Default
    private String sourceType = "MANUAL";

    @Column(name = "SOURCE_LTT_ID")
    private Long sourceLttId;

    // === Relationship: Line Items ===
    @OneToMany(mappedBy = "ltt", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineNo ASC")
    @Builder.Default
    private List<LttLineItem> lineItems = new ArrayList<>();

    // === Relationship: Attachments ===
    @OneToMany(mappedBy = "ltt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LttAttachment> attachments = new ArrayList<>();
}
