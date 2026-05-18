package com.kb.ltt.domain.model;

import com.kb.ltt.domain.model.enums.OrderStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "payment_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "uuid", unique = true, nullable = false, length = 36)
    private String uuid;

    @Column(name = "ref_no", unique = true, nullable = false, length = 50)
    private String refNo;

    @Column(name = "org_num", length = 50)
    private String orgNum;

    @Column(name = "channel", nullable = false, length = 30)
    private String channel;

    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType;

    @Column(name = "lnh_transaction_type", length = 50)
    private String lnhTransactionType;

    @Column(name = "sender", nullable = false, length = 20)
    private String sender;

    @Column(name = "receiver", nullable = false, length = 20)
    private String receiver;

    @Column(name = "amount", nullable = false, precision = 22, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency_code", nullable = false, length = 3)
    @Builder.Default
    private String currencyCode = "VND";

    @Column(name = "exchange_rate", precision = 18, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "fn_code1", length = 3)
    private String fnCode1;

    @Column(name = "fn_code2", length = 3)
    private String fnCode2;

    @Column(name = "fn_amount", precision = 22, scale = 2)
    private BigDecimal fnAmount;

    @Column(name = "exp_type", length = 30)
    private String expType;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "transaction_date")
    private LocalDate transactionDate;

    @Column(name = "accounting_date")
    private LocalDate accountingDate;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "sender_name", length = 200)
    private String senderName;

    @Column(name = "sender_address", length = 300)
    private String senderAddress;

    @Column(name = "sender_gl_segment2", length = 4)
    private String senderGlSegment2;

    @Column(name = "sender_num", length = 50)
    private String senderNum;

    @Column(name = "sender_bank_code", length = 20)
    private String senderBankCode;

    @Column(name = "sender_identify_id", length = 50)
    private String senderIdentifyId;

    @Column(name = "sender_issued_date")
    private LocalDate senderIssuedDate;

    @Column(name = "sender_issued_place", length = 200)
    private String senderIssuedPlace;

    @Column(name = "tpcp_code", length = 30)
    private String tpcpCode;

    @Column(name = "receiver_name", length = 200)
    private String receiverName;

    @Column(name = "receiver_address", length = 300)
    private String receiverAddress;

    @Column(name = "receiver_gl_segment2", length = 4)
    private String receiverGlSegment2;

    @Column(name = "receiver_bank_name", length = 200)
    private String receiverBankName;

    @Column(name = "receiver_bank_code", length = 50)
    private String receiverBankCode;

    @Column(name = "receiver_identify_id", length = 50)
    private String receiverIdentifyId;

    @Column(name = "receiver_issued_date")
    private LocalDate receiverIssuedDate;

    @Column(name = "receiver_issued_place", length = 200)
    private String receiverIssuedPlace;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.DRAFT;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "created_by", nullable = false, length = 40)
    private String createdBy;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "last_updated_by", length = 40)
    private String lastUpdatedBy;

    @Column(name = "last_updated_date")
    private LocalDateTime lastUpdatedDate;

    @Column(name = "checked_by", length = 40)
    private String checkedBy;

    @Column(name = "checked_date")
    private LocalDateTime checkedDate;

    @Column(name = "approved_by", length = 40)
    private String approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @Column(name = "deleted_by", length = 40)
    private String deletedBy;

    @Column(name = "deleted_date")
    private LocalDateTime deletedDate;

    @Column(name = "delete_reason", length = 500)
    private String deleteReason;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "idempotency_key", length = 64)
    private String idempotencyKey;

    @OneToMany(mappedBy = "paymentOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PaymentOrderDetail> details = new ArrayList<>();

    @OneToMany(mappedBy = "paymentOrder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ApprovalLog> approvalLogs = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (uuid == null) {
            uuid = UUID.randomUUID().toString();
        }
        createdDate = LocalDateTime.now();
        if (version == null) {
            version = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdatedDate = LocalDateTime.now();
    }

    public void addDetail(PaymentOrderDetail detail) {
        details.add(detail);
        detail.setPaymentOrder(this);
    }

    public void removeDetail(PaymentOrderDetail detail) {
        details.remove(detail);
        detail.setPaymentOrder(null);
    }
}
