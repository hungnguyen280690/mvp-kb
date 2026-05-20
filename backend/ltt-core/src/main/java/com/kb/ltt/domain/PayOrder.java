package com.kb.ltt.domain;

import com.kb.ltt.domain.enums.*;
import com.kb.ltt.domain.exception.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root: LTT_PAY_ORDER - Lệnh Thanh Toán Đi Thủ Công.
 *
 * State Machine (10 transitions tu 02-design.md Section 5.2):
 *   1. CREATE          → DRAFT
 *   2. UPDATE          → DRAFT/RETURNED_TO_MAKER (no status change)
 *   3. SUBMIT          → DRAFT/RETURNED_TO_MAKER → READY_FOR_APPROVAL
 *   4. DELETE          → DRAFT/RETURNED_TO_MAKER → DELETED
 *   5. CHECK_APPROVE   → READY_FOR_APPROVAL → PENDING_APPROVER
 *   6. RETURN_BY_CHECKER  → READY_FOR_APPROVAL → RETURNED_TO_MAKER
 *   7. REJECT_BY_CHECKER  → READY_FOR_APPROVAL → REJECTED
 *   8. APPROVE         → PENDING_APPROVER → APPROVED
 *   9. RETURN_BY_APPROVER → PENDING_APPROVER → RETURNED_TO_MAKER
 *  10. REJECT_BY_APPROVER → PENDING_APPROVER → REJECTED
 *
 * SoD (BIZ-001): createdBy != checkerId != approverId
 * Optimistic Lock (ADR-0004): version field
 *
 * PURE JAVA - zero framework dependency (Hexagonal Architecture).
 */
@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class PayOrder {

    // ===== F-ID: Khoá chính UUID (INC-G-01) =====
    private String id;

    // ===== F-VER: Optimistic lock version (ADR-0004, VAL-15) =====
    private long version;

    // ===== F-STATUS: Trang thai workflow =====
    private OrderStatus status;

    // ===== REF_NO: Auto-generate <KBNN>-YYYYMM-<seq6> (INC-G-02) =====
    private String refNo;

    // ===== Tab B1.1: Thong tin chung =====
    private OrderChannel channel;
    private String orderType;              // conditional, NULL khi channel=LIEN_KHO_BAC
    private LnhTransactionType lnhTransactionType;  // conditional khi channel=LNH
    private String sender;                 // Ma NH/KB chuyen
    private String receiver;               // Ma NH/KB nhan
    private LocalDate paymentDate;         // Editable, validate trong ky OPEN
    private BigDecimal amount;             // = SUM(LTT_PAY_ORDER_LINE.LINE_AMOUNT)
    private String currencyCode;           // default 'VND'
    private BigDecimal exchangeRate;       // conditional khi currency != VND
    private String originNum;              // So chung tu goc - bat buoc khi channel=TTSP
    private LocalDate transactionDate;     // Ngay chung tu - bat buoc khi channel=TTSP
    private ExpType expType;               // EXP01..EXP05
    private String fnCode1;                // Ma ngoai te trich no
    private String fnCode2;                // Ma ngoai te TT
    private BigDecimal fnAmount;           // So tien ngoai te TT
    private String description;            // Noi dung thanh toan (header)

    // ===== Tab B1.3: Thong tin nguoi chuyen (Payer/Sender) =====
    private String senderName;
    private String senderAddress;
    private String senderGlSegment2;       // TK tu nhien nguoi chuyen (LOV.07.2)
    private String senderNum;              // Ma KH
    private String senderBankCode;         // Mo tai NH/KB
    private String senderIdentifyId;       // CMND/CCCD/HC/Ma DN
    private LocalDate senderIssuedDate;
    private String senderIssuedPlace;
    private String tpcpCode;               // Ma TPCP

    // ===== Tab B1.4: Thong tin nguoi nhan (Payee/Receiver) =====
    private String receiverName;
    private String receiverAddress;
    private String receiverGlSegment2;     // So tai khoan nguoi nhan
    private String receiverBankCode;       // Mo tai NH/KB nguoi nhan
    private String receiverAccountName;    // Ten tai khoan nguoi nhan
    private String receiverIdentifyId;
    private LocalDate receiverIssuedDate;
    private String receiverIssuedPlace;

    // ===== Workflow attribution (Maker-Checker-Approver) =====
    private String kbnnId;                 // Ma KBNN chu quan record
    private String createdBy;              // Maker goc
    private OffsetDateTime createdAt;
    private String createdIp;
    private String updatedBy;
    private OffsetDateTime updatedAt;
    private String updatedIp;
    private String checkerId;              // Set khi Checker action
    private OffsetDateTime checkerActionAt;
    private String checkerComment;
    private String approverId;             // Set khi Approver action
    private OffsetDateTime approverActionAt;
    private String approverComment;

    // ===== Soft delete =====
    private String deleteReason;
    private String deletedBy;
    private OffsetDateTime deletedAt;
    private String deletedIp;

    // ===== Idempotency tracking (ADR-0005) =====
    private String idempotencyKey;

    // ===== Child collections =====
    @Builder.Default
    private List<PayOrderLine> lines = new ArrayList<>();

    @Builder.Default
    private List<PayOrderAttachment> attachments = new ArrayList<>();

    @Builder.Default
    private List<PayOrderApproval> approvals = new ArrayList<>();

    // ===================================================================
    // FACTORY METHOD
    // ===================================================================

    /**
     * Transition 1: CREATE → DRAFT.
     * BDD: bdd-01-scenario-01.
     *
     * @param refNo       auto-generated ref_no
     * @param channel     kenh giao dich
     * @param kbnnId      ma KBNN chu quan
     * @param createdBy   user Maker
     * @param createdIp   IP cua Maker
     * @param idempotencyKey idempotency key cua request
     * @return PayOrder moi voi status = DRAFT
     */
    public static PayOrder create(
            String refNo,
            OrderChannel channel,
            String kbnnId,
            String createdBy,
            String createdIp,
            String idempotencyKey) {

        PayOrder order = PayOrder.builder()
                .id(UUID.randomUUID().toString())
                .version(1L)
                .status(OrderStatus.DRAFT)
                .refNo(refNo)
                .channel(channel)
                .kbnnId(kbnnId)
                .createdBy(createdBy)
                .createdAt(OffsetDateTime.now())
                .createdIp(createdIp)
                .currencyCode("VND")
                .idempotencyKey(idempotencyKey)
                .lines(new ArrayList<>())
                .attachments(new ArrayList<>())
                .approvals(new ArrayList<>())
                .build();

        // BDD: bdd-01-scenario-01 - CREATE action ghi vao approval history
        order.approvals.add(PayOrderApproval.builder()
                .id(UUID.randomUUID().toString())
                .orderId(order.id)
                .stepNo(1)
                .action(ApprovalAction.CREATE)
                .fromStatus(null)
                .toStatus(OrderStatus.DRAFT)
                .performedBy(createdBy)
                .performedRole(PerformedRole.MAKER)
                .performedAt(OffsetDateTime.now())
                .performedIp(createdIp)
                .versionBefore(0)
                .versionAfter(1)
                .build());

        return order;
    }

    // ===================================================================
    // TRANSITION 2: UPDATE (DRAFT / RETURNED_TO_MAKER - no status change)
    // ===================================================================

    /**
     * Transition 2: UPDATE chi cho phep khi status = DRAFT hoac RETURNED_TO_MAKER.
     * BDD: bdd-01-scenario-01 (DRAFT editable), bdd-03-scenario-02 (RETURNED editable).
     *
     * @param updaterId   user thuc hien (phai la Maker goc)
     * @param updaterIp   IP cua user
     * @param expectedVersion version tu client (If-Match)
     */
    public void update(String updaterId, String updaterIp, long expectedVersion) {
        // BDD: bdd-01-scenario-01 - chi Maker goc duoc sua
        if (!status.isEditable()) {
            throw new InvalidStateTransitionException(status, status,
                    "Order cannot be updated in status " + status);
        }

        // BDD: bdd-05-scenario-01 - chi Maker goc duoc sua
        if (!createdBy.equals(updaterId)) {
            throw new BusinessRuleException("BIZ-001",
                    "Only the original Maker can update this order");
        }

        // BDD: bdd-05-scenario-01 - optimistic lock check (ADR-0004)
        verifyVersion(expectedVersion);

        this.updatedBy = updaterId;
        this.updatedAt = OffsetDateTime.now();
        this.updatedIp = updaterIp;

        // Ghi approval history cho UPDATE action
        addApprovalEntry(ApprovalAction.UPDATE, status, status, updaterId,
                PerformedRole.MAKER, updaterIp, null);
    }

    // ===================================================================
    // TRANSITION 3: SUBMIT → READY_FOR_APPROVAL
    // ===================================================================

    /**
     * Transition 3: SUBMIT - DRAFT/RETURNED_TO_MAKER → READY_FOR_APPROVAL.
     * BDD: bdd-02-scenario-01 (DRAFT submit), bdd-03-scenario-03 (RETURNED resubmit).
     *
     * @param submitterId   user thuc hien (phai la Maker goc)
     * @param submitterIp   IP cua user
     * @param expectedVersion version tu client (If-Match)
     */
    public void submit(String submitterId, String submitterIp, long expectedVersion) {
        // BDD: bdd-02-scenario-01 - chi submit tu DRAFT hoac RETURNED_TO_MAKER
        if (!status.isSubmittable()) {
            throw new InvalidStateTransitionException(status, OrderStatus.READY_FOR_APPROVAL,
                    "Cannot submit from status " + status);
        }

        // BDD: bdd-05-scenario-01 - chi Maker goc duoc submit
        if (!createdBy.equals(submitterId)) {
            throw new BusinessRuleException("BIZ-001",
                    "Only the original Maker can submit this order");
        }

        // BDD: bdd-05-scenario-01 - optimistic lock check
        verifyVersion(expectedVersion);

        OrderStatus fromStatus = this.status;
        this.status = OrderStatus.READY_FOR_APPROVAL;
        this.updatedBy = submitterId;
        this.updatedAt = OffsetDateTime.now();
        this.updatedIp = submitterIp;

        // BDD: bdd-02-scenario-01 - ghi approval history
        addApprovalEntry(ApprovalAction.SUBMIT, fromStatus, OrderStatus.READY_FOR_APPROVAL,
                submitterId, PerformedRole.MAKER, submitterIp, null);
    }

    // ===================================================================
    // TRANSITION 4: DELETE (soft-delete)
    // ===================================================================

    /**
     * Transition 4: DELETE - DRAFT/RETURNED_TO_MAKER → DELETED.
     * BDD: bdd-06-scenario-01.
     *
     * @param deleterId       user thuc hien (phai la Maker goc)
     * @param deleterIp       IP cua user
     * @param deleteReason    ly do xoa (10-500 ky tu) - VAL-16, BIZ-006
     * @param expectedVersion version tu client (If-Match)
     */
    public void softDelete(String deleterId, String deleterIp,
                           String deleteReason, long expectedVersion) {
        // BDD: bdd-06-scenario-01 - chi xoa tu DRAFT hoac RETURNED_TO_MAKER
        if (!status.isDeletable()) {
            throw new InvalidStateTransitionException(status, OrderStatus.DELETED,
                    "Cannot delete from status " + status);
        }

        // BDD: bdd-06-scenario-01 - chi Maker goc duoc xoa
        if (!createdBy.equals(deleterId)) {
            throw new BusinessRuleException("BIZ-001",
                    "Only the original Maker can delete this order");
        }

        // BDD: bdd-06-scenario-01 - optimistic lock check
        verifyVersion(expectedVersion);

        // VAL-16: delete reason phai tu 10-500 ky tu
        if (deleteReason == null || deleteReason.length() < 10 || deleteReason.length() > 500) {
            throw new BusinessRuleException("VAL-16",
                    "Delete reason must be between 10 and 500 characters");
        }

        OrderStatus fromStatus = this.status;
        this.status = OrderStatus.DELETED;
        this.deleteReason = deleteReason;
        this.deletedBy = deleterId;
        this.deletedAt = OffsetDateTime.now();
        this.deletedIp = deleterIp;
        this.updatedBy = deleterId;
        this.updatedAt = OffsetDateTime.now();
        this.updatedIp = deleterIp;

        // BDD: bdd-06-scenario-01 - ghi approval history
        addApprovalEntry(ApprovalAction.DELETE, fromStatus, OrderStatus.DELETED,
                deleterId, PerformedRole.MAKER, deleterIp, deleteReason);
    }

    // ===================================================================
    // TRANSITION 5: CHECK_APPROVE → PENDING_APPROVER
    // ===================================================================

    /**
     * Transition 5: CHECK_APPROVE - READY_FOR_APPROVAL → PENDING_APPROVER.
     * BDD: bdd-04-scenario-01.
     *
     * @param checkerId       user Checker thuc hien
     * @param checkerIp       IP cua Checker
     * @param expectedVersion version tu client (If-Match)
     */
    public void checkApprove(String checkerId, String checkerIp, long expectedVersion) {
        // BDD: bdd-04-scenario-01 - chi tu READY_FOR_APPROVAL
        if (status != OrderStatus.READY_FOR_APPROVAL) {
            throw new InvalidStateTransitionException(status, OrderStatus.PENDING_APPROVER,
                    "CHECK_APPROVE is only allowed from READY_FOR_APPROVAL");
        }

        // BDD: bdd-04-scenario-01 - SoD: checkerId != createdBy (BIZ-001)
        if (checkerId.equals(createdBy)) {
            throw new SoDViolationException(checkerId, "CHECKER");
        }

        // BDD: bdd-04-scenario-01 - optimistic lock check
        verifyVersion(expectedVersion);

        this.status = OrderStatus.PENDING_APPROVER;
        this.checkerId = checkerId;
        this.checkerActionAt = OffsetDateTime.now();
        this.updatedBy = checkerId;
        this.updatedAt = OffsetDateTime.now();
        this.updatedIp = checkerIp;

        // BDD: bdd-04-scenario-01 - ghi approval history
        addApprovalEntry(ApprovalAction.CHECK_APPROVE, OrderStatus.READY_FOR_APPROVAL,
                OrderStatus.PENDING_APPROVER, checkerId, PerformedRole.CHECKER, checkerIp, null);
    }

    // ===================================================================
    // TRANSITION 8: APPROVE → APPROVED
    // ===================================================================

    /**
     * Transition 8: APPROVE - PENDING_APPROVER → APPROVED.
     * BDD: bdd-04-scenario-03.
     *
     * @param approverId      user Approver thuc hien
     * @param approverIp      IP cua Approver
     * @param expectedVersion version tu client (If-Match)
     */
    public void approve(String approverId, String approverIp, long expectedVersion) {
        // BDD: bdd-04-scenario-03 - chi tu PENDING_APPROVER
        if (status != OrderStatus.PENDING_APPROVER) {
            throw new InvalidStateTransitionException(status, OrderStatus.APPROVED,
                    "APPROVE is only allowed from PENDING_APPROVER");
        }

        // BDD: bdd-04-scenario-03 - SoD: approverId != createdBy AND approverId != checkerId
        if (approverId.equals(createdBy)) {
            throw new SoDViolationException(approverId, "APPROVER");
        }
        if (checkerId != null && approverId.equals(checkerId)) {
            throw new SoDViolationException(approverId, "APPROVER");
        }

        // BDD: bdd-04-scenario-03 - optimistic lock check
        verifyVersion(expectedVersion);

        this.status = OrderStatus.APPROVED;
        this.approverId = approverId;
        this.approverActionAt = OffsetDateTime.now();
        this.updatedBy = approverId;
        this.updatedAt = OffsetDateTime.now();
        this.updatedIp = approverIp;

        // BDD: bdd-04-scenario-03 - ghi approval history
        addApprovalEntry(ApprovalAction.APPROVE, OrderStatus.PENDING_APPROVER,
                OrderStatus.APPROVED, approverId, PerformedRole.APPROVER, approverIp, null);
    }

    // ===================================================================
    // TRANSITION 6 & 7: RETURN / REJECT by CHECKER
    // TRANSITION 9 & 10: RETURN / REJECT by APPROVER
    // ===================================================================

    /**
     * Return order to Maker (by Checker or Approver).
     * Transition 6: READY_FOR_APPROVAL → RETURNED_TO_MAKER (by Checker).
     * Transition 9: PENDING_APPROVER → RETURNED_TO_MAKER (by Approver).
     * BDD: bdd-04-scenario-02 (Checker return), bdd-04-scenario-04 (Approver return).
     *
     * @param actorId         user thuc hien (Checker hoac Approver)
     * @param actorRole       role cua user
     * @param actorIp         IP cua user
     * @param reason          ly do return (>= 10 ky tu)
     * @param expectedVersion version tu client (If-Match)
     */
    public void returnOrder(String actorId, PerformedRole actorRole, String actorIp,
                            String reason, long expectedVersion) {
        // BDD: bdd-04-scenario-02, bdd-04-scenario-04 - validate source status + role
        if (actorRole == PerformedRole.CHECKER) {
            // BDD: bdd-04-scenario-02 - Checker return tu READY_FOR_APPROVAL
            if (status != OrderStatus.READY_FOR_APPROVAL) {
                throw new InvalidStateTransitionException(status, OrderStatus.RETURNED_TO_MAKER,
                        "Checker can only return from READY_FOR_APPROVAL");
            }
            // SoD: checkerId != createdBy
            if (actorId.equals(createdBy)) {
                throw new SoDViolationException(actorId, "CHECKER");
            }
            this.checkerId = actorId;
            this.checkerActionAt = OffsetDateTime.now();
            this.checkerComment = reason;
        } else if (actorRole == PerformedRole.APPROVER) {
            // BDD: bdd-04-scenario-04 - Approver return tu PENDING_APPROVER
            if (status != OrderStatus.PENDING_APPROVER) {
                throw new InvalidStateTransitionException(status, OrderStatus.RETURNED_TO_MAKER,
                        "Approver can only return from PENDING_APPROVER");
            }
            // SoD: approverId != createdBy AND approverId != checkerId
            if (actorId.equals(createdBy)) {
                throw new SoDViolationException(actorId, "APPROVER");
            }
            if (checkerId != null && actorId.equals(checkerId)) {
                throw new SoDViolationException(actorId, "APPROVER");
            }
            this.approverId = actorId;
            this.approverActionAt = OffsetDateTime.now();
            this.approverComment = reason;
        } else {
            throw new BusinessRuleException("BIZ-001",
                    "Only CHECKER or APPROVER can return an order");
        }

        // BDD: bdd-04-scenario-02 - optimistic lock check
        verifyVersion(expectedVersion);

        // Reason phai >= 10 ky tu
        if (reason == null || reason.length() < 10) {
            throw new BusinessRuleException("VAL-16",
                    "Return reason must be at least 10 characters");
        }

        OrderStatus fromStatus = this.status;
        this.status = OrderStatus.RETURNED_TO_MAKER;
        this.updatedBy = actorId;
        this.updatedAt = OffsetDateTime.now();
        this.updatedIp = actorIp;

        // Determine action enum based on role
        ApprovalAction action = (actorRole == PerformedRole.CHECKER)
                ? ApprovalAction.RETURN_BY_CHECKER
                : ApprovalAction.RETURN_BY_APPROVER;

        // BDD: bdd-04-scenario-02 - ghi approval history
        addApprovalEntry(action, fromStatus, OrderStatus.RETURNED_TO_MAKER,
                actorId, actorRole, actorIp, reason);
    }

    /**
     * Reject order (by Checker or Approver).
     * Transition 7: READY_FOR_APPROVAL → REJECTED (by Checker).
     * Transition 10: PENDING_APPROVER → REJECTED (by Approver).
     * BDD: bdd-04-scenario-02 (Checker reject), bdd-04-scenario-04 (Approver reject).
     *
     * @param actorId         user thuc hien (Checker hoac Approver)
     * @param actorRole       role cua user
     * @param actorIp         IP cua user
     * @param reason          ly do reject (>= 10 ky tu)
     * @param expectedVersion version tu client (If-Match)
     */
    public void reject(String actorId, PerformedRole actorRole, String actorIp,
                       String reason, long expectedVersion) {
        // BDD: bdd-04-scenario-02, bdd-04-scenario-04 - validate source status + role
        if (actorRole == PerformedRole.CHECKER) {
            // BDD: bdd-04-scenario-02 - Checker reject tu READY_FOR_APPROVAL
            if (status != OrderStatus.READY_FOR_APPROVAL) {
                throw new InvalidStateTransitionException(status, OrderStatus.REJECTED,
                        "Checker can only reject from READY_FOR_APPROVAL");
            }
            // SoD: checkerId != createdBy
            if (actorId.equals(createdBy)) {
                throw new SoDViolationException(actorId, "CHECKER");
            }
            this.checkerId = actorId;
            this.checkerActionAt = OffsetDateTime.now();
            this.checkerComment = reason;
        } else if (actorRole == PerformedRole.APPROVER) {
            // BDD: bdd-04-scenario-04 - Approver reject tu PENDING_APPROVER
            if (status != OrderStatus.PENDING_APPROVER) {
                throw new InvalidStateTransitionException(status, OrderStatus.REJECTED,
                        "Approver can only reject from PENDING_APPROVER");
            }
            // SoD: approverId != createdBy AND approverId != checkerId
            if (actorId.equals(createdBy)) {
                throw new SoDViolationException(actorId, "APPROVER");
            }
            if (checkerId != null && actorId.equals(checkerId)) {
                throw new SoDViolationException(actorId, "APPROVER");
            }
            this.approverId = actorId;
            this.approverActionAt = OffsetDateTime.now();
            this.approverComment = reason;
        } else {
            throw new BusinessRuleException("BIZ-001",
                    "Only CHECKER or APPROVER can reject an order");
        }

        // BDD: bdd-04-scenario-02 - optimistic lock check
        verifyVersion(expectedVersion);

        // Reason phai >= 10 ky tu
        if (reason == null || reason.length() < 10) {
            throw new BusinessRuleException("VAL-16",
                    "Reject reason must be at least 10 characters");
        }

        OrderStatus fromStatus = this.status;
        this.status = OrderStatus.REJECTED;
        this.updatedBy = actorId;
        this.updatedAt = OffsetDateTime.now();
        this.updatedIp = actorIp;

        // Determine action enum based on role
        ApprovalAction action = (actorRole == PerformedRole.CHECKER)
                ? ApprovalAction.REJECT_BY_CHECKER
                : ApprovalAction.REJECT_BY_APPROVER;

        // BDD: bdd-04-scenario-02 - ghi approval history
        addApprovalEntry(action, fromStatus, OrderStatus.REJECTED,
                actorId, actorRole, actorIp, reason);
    }

    // ===================================================================
    // COPY (clone → DRAFT)
    // ===================================================================

    /**
     * Tao ban sao tu lenh san co → DRAFT moi.
     * BDD: bdd-07-scenario-01.
     *
     * @param copierId      user thuc hien copy
     * @param copierIp      IP cua user
     * @param newRefNo      ref_no moi cho ban sao
     * @param idempotencyKey idempotency key cua request
     * @return PayOrder moi voi status = DRAFT
     */
    public PayOrder copy(String copierId, String copierIp,
                         String newRefNo, String idempotencyKey) {
        // BDD: bdd-07-scenario-01 - cho phep copy tu moi trang thai (tru DELETED)
        if (this.status == OrderStatus.DELETED) {
            throw new BusinessRuleException("BIZ-006",
                    "Cannot copy a DELETED order");
        }

        PayOrder copy = PayOrder.builder()
                .id(UUID.randomUUID().toString())
                .version(1L)
                .status(OrderStatus.DRAFT)
                .refNo(newRefNo)
                .channel(this.channel)
                .orderType(this.orderType)
                .lnhTransactionType(this.lnhTransactionType)
                .sender(this.sender)
                .receiver(this.receiver)
                .paymentDate(this.paymentDate)
                .amount(this.amount)
                .currencyCode(this.currencyCode)
                .exchangeRate(this.exchangeRate)
                .originNum(this.originNum)
                .transactionDate(this.transactionDate)
                .expType(this.expType)
                .fnCode1(this.fnCode1)
                .fnCode2(this.fnCode2)
                .fnAmount(this.fnAmount)
                .description(this.description)
                .senderName(this.senderName)
                .senderAddress(this.senderAddress)
                .senderGlSegment2(this.senderGlSegment2)
                .senderNum(this.senderNum)
                .senderBankCode(this.senderBankCode)
                .senderIdentifyId(this.senderIdentifyId)
                .senderIssuedDate(this.senderIssuedDate)
                .senderIssuedPlace(this.senderIssuedPlace)
                .tpcpCode(this.tpcpCode)
                .receiverName(this.receiverName)
                .receiverAddress(this.receiverAddress)
                .receiverGlSegment2(this.receiverGlSegment2)
                .receiverBankCode(this.receiverBankCode)
                .receiverAccountName(this.receiverAccountName)
                .receiverIdentifyId(this.receiverIdentifyId)
                .receiverIssuedDate(this.receiverIssuedDate)
                .receiverIssuedPlace(this.receiverIssuedPlace)
                .kbnnId(this.kbnnId)
                .createdBy(copierId)
                .createdAt(OffsetDateTime.now())
                .createdIp(copierIp)
                .currencyCode(this.currencyCode != null ? this.currencyCode : "VND")
                .idempotencyKey(idempotencyKey)
                .lines(new ArrayList<>(this.lines))
                .attachments(new ArrayList<>())   // BDD: bdd-07-scenario-01 - khong copy attachments
                .approvals(new ArrayList<>())
                .build();

        // Ghi CREATE action cho ban sao
        copy.approvals.add(PayOrderApproval.builder()
                .id(UUID.randomUUID().toString())
                .orderId(copy.id)
                .stepNo(1)
                .action(ApprovalAction.CREATE)
                .fromStatus(null)
                .toStatus(OrderStatus.DRAFT)
                .performedBy(copierId)
                .performedRole(PerformedRole.MAKER)
                .performedAt(OffsetDateTime.now())
                .performedIp(copierIp)
                .versionBefore(0)
                .versionAfter(1)
                .build());

        return copy;
    }

    // ===================================================================
    // FIELD UPDATERS (for use within UPDATE transition only)
    // ===================================================================

    /**
     * Cap nhat cac field header. Chi goi trong pham vi update().
     * BDD: bdd-01-scenario-01 (DRAFT update fields).
     */
    public void updateFields(
            OrderChannel channel,
            String orderType,
            LnhTransactionType lnhTransactionType,
            String sender,
            String receiver,
            LocalDate paymentDate,
            BigDecimal amount,
            String currencyCode,
            BigDecimal exchangeRate,
            String originNum,
            LocalDate transactionDate,
            ExpType expType,
            String fnCode1,
            String fnCode2,
            BigDecimal fnAmount,
            String description,
            String senderName,
            String senderAddress,
            String senderGlSegment2,
            String senderNum,
            String senderBankCode,
            String senderIdentifyId,
            LocalDate senderIssuedDate,
            String senderIssuedPlace,
            String tpcpCode,
            String receiverName,
            String receiverAddress,
            String receiverGlSegment2,
            String receiverBankCode,
            String receiverAccountName,
            String receiverIdentifyId,
            LocalDate receiverIssuedDate,
            String receiverIssuedPlace) {

        this.channel = channel;
        this.orderType = orderType;
        this.lnhTransactionType = lnhTransactionType;
        this.sender = sender;
        this.receiver = receiver;
        this.paymentDate = paymentDate;
        this.amount = amount;
        this.currencyCode = currencyCode;
        this.exchangeRate = exchangeRate;
        this.originNum = originNum;
        this.transactionDate = transactionDate;
        this.expType = expType;
        this.fnCode1 = fnCode1;
        this.fnCode2 = fnCode2;
        this.fnAmount = fnAmount;
        this.description = description;
        this.senderName = senderName;
        this.senderAddress = senderAddress;
        this.senderGlSegment2 = senderGlSegment2;
        this.senderNum = senderNum;
        this.senderBankCode = senderBankCode;
        this.senderIdentifyId = senderIdentifyId;
        this.senderIssuedDate = senderIssuedDate;
        this.senderIssuedPlace = senderIssuedPlace;
        this.tpcpCode = tpcpCode;
        this.receiverName = receiverName;
        this.receiverAddress = receiverAddress;
        this.receiverGlSegment2 = receiverGlSegment2;
        this.receiverBankCode = receiverBankCode;
        this.receiverAccountName = receiverAccountName;
        this.receiverIdentifyId = receiverIdentifyId;
        this.receiverIssuedDate = receiverIssuedDate;
        this.receiverIssuedPlace = receiverIssuedPlace;
    }

    /**
     * Thay the toan bo danh sach lines.
     * BDD: bdd-01-scenario-01 (update lines trong DRAFT).
     */
    public void replaceLines(List<PayOrderLine> newLines) {
        this.lines = new ArrayList<>(newLines);
    }

    // ===================================================================
    // PRIVATE HELPERS
    // ===================================================================

    /**
     * Verify optimistic lock version - ADR-0004.
     * BDD: bdd-05-scenario-01.
     */
    private void verifyVersion(long expectedVersion) {
        if (this.version != expectedVersion) {
            throw new OptimisticLockException(this.version, expectedVersion);
        }
    }

    /**
     * Them entry vao approval history (append-only).
     */
    private void addApprovalEntry(ApprovalAction action, OrderStatus fromStatus,
                                  OrderStatus toStatus, String performedBy,
                                  PerformedRole performedRole, String performedIp,
                                  String reason) {
        int nextStepNo = this.approvals.size() + 1;
        long versionBefore = this.version;
        // Version will be incremented by JPA @Version on save, record version_after as expected
        long versionAfter = this.version + 1;

        this.approvals.add(PayOrderApproval.builder()
                .id(UUID.randomUUID().toString())
                .orderId(this.id)
                .stepNo(nextStepNo)
                .action(action)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .performedBy(performedBy)
                .performedRole(performedRole)
                .performedAt(OffsetDateTime.now())
                .performedIp(performedIp)
                .reason(reason)
                .versionBefore((int) versionBefore)
                .versionAfter((int) versionAfter)
                .build());
    }
}
