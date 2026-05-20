package com.kb.ltt.domain.model;

import com.kb.ltt.domain.exception.InvalidStatusTransitionException;
import com.kb.ltt.domain.exception.SoDViolationException;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Aggregate root for a payment order (Lệnh Thanh Toán).
 * Pure Java — NO JPA / Spring annotations.
 *
 * State machine transitions:
 *   DRAFT ──submit──► READY_FOR_APPROVAL ──checkApprove──► PENDING_APPROVER ──approve──► APPROVED
 *   READY_FOR_APPROVAL  ──returnToMaker──► RETURNED_TO_MAKER ──submit──► READY_FOR_APPROVAL
 *   PENDING_APPROVER    ──returnToMaker──► RETURNED_TO_MAKER
 *   READY_FOR_APPROVAL  ──reject──► REJECTED
 *   PENDING_APPROVER    ──reject──► REJECTED
 *   DRAFT               ──softDelete──► DELETED
 *   RETURNED_TO_MAKER   ──softDelete──► DELETED
 */
@Getter
@Builder(toBuilder = true)
public class PayOrder {

    // ── Identity & versioning ──────────────────────────────────────────────
    private final String id;
    private final int version;
    private final PayOrderStatus status;

    // ── Header ────────────────────────────────────────────────────────────
    private final String refNo;
    private final ChannelCode channel;
    private final String orderType;
    private final LnhTransactionType lnhTransactionType;
    private final String sender;
    private final String receiver;
    private final LocalDate paymentDate;
    private final BigDecimal amount;
    private final String currencyCode;         // default "VND"
    private final BigDecimal exchangeRate;
    private final String originNum;
    private final LocalDate transactionDate;
    private final ExpenseType expType;
    private final String fnCode1;
    private final String fnCode2;
    private final BigDecimal fnAmount;
    private final String description;

    // ── Sender details ────────────────────────────────────────────────────
    private final String senderName;
    private final String senderAddress;
    private final String senderGlSegment2;
    private final String senderNum;
    private final String senderBankCode;
    private final String senderIdentifyId;
    private final LocalDate senderIssuedDate;
    private final String senderIssuedPlace;
    private final String tpcpCode;

    // ── Receiver details ──────────────────────────────────────────────────
    private final String receiverName;
    private final String receiverAddress;
    private final String receiverGlSegment2;
    private final String receiverBankCode;
    private final String receiverAccountName;
    private final String receiverIdentifyId;
    private final LocalDate receiverIssuedDate;
    private final String receiverIssuedPlace;

    // ── Audit ─────────────────────────────────────────────────────────────
    private final String kbnnId;
    private final String createdBy;
    private final Instant createdAt;
    private final String createdIp;
    private final String updatedBy;
    private final Instant updatedAt;
    private final String updatedIp;

    // ── Workflow participants ──────────────────────────────────────────────
    private final String checkerId;
    private final Instant checkerActionAt;
    private final String checkerComment;
    private final String approverId;
    private final Instant approverActionAt;
    private final String approverComment;

    // ── Soft delete ───────────────────────────────────────────────────────
    private final String deleteReason;
    private final String deletedBy;
    private final Instant deletedAt;
    private final String deletedIp;

    // ── Children ──────────────────────────────────────────────────────────
    private final List<PayOrderLine> lines;
    private final List<PayOrderAttachment> attachments;

    // ─────────────────────────────────────────────────────────────────────
    // Builder customisation: default currencyCode to "VND" and ensure
    // mutable collections are never exposed as null.
    // ─────────────────────────────────────────────────────────────────────
    public static class PayOrderBuilder {

        public PayOrder build() {
            if (this.currencyCode == null) {
                this.currencyCode = "VND";
            }
            if (this.lines == null) {
                this.lines = new ArrayList<>();
            }
            if (this.attachments == null) {
                this.attachments = new ArrayList<>();
            }
            return new PayOrder(
                    id, version, status, refNo, channel, orderType, lnhTransactionType,
                    sender, receiver, paymentDate, amount, currencyCode, exchangeRate,
                    originNum, transactionDate, expType, fnCode1, fnCode2, fnAmount,
                    description,
                    senderName, senderAddress, senderGlSegment2, senderNum, senderBankCode,
                    senderIdentifyId, senderIssuedDate, senderIssuedPlace, tpcpCode,
                    receiverName, receiverAddress, receiverGlSegment2, receiverBankCode,
                    receiverAccountName, receiverIdentifyId, receiverIssuedDate, receiverIssuedPlace,
                    kbnnId, createdBy, createdAt, createdIp, updatedBy, updatedAt, updatedIp,
                    checkerId, checkerActionAt, checkerComment,
                    approverId, approverActionAt, approverComment,
                    deleteReason, deletedBy, deletedAt, deletedIp,
                    Collections.unmodifiableList(lines),
                    Collections.unmodifiableList(attachments)
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // State Machine
    // ─────────────────────────────────────────────────────────────────────

    private static final Set<PayOrderStatus> SUBMITTABLE =
            EnumSet.of(PayOrderStatus.DRAFT, PayOrderStatus.RETURNED_TO_MAKER);

    private static final Set<PayOrderStatus> RETURNABLE =
            EnumSet.of(PayOrderStatus.READY_FOR_APPROVAL, PayOrderStatus.PENDING_APPROVER);

    private static final Set<PayOrderStatus> REJECTABLE =
            EnumSet.of(PayOrderStatus.READY_FOR_APPROVAL, PayOrderStatus.PENDING_APPROVER);

    private static final Set<PayOrderStatus> DELETABLE =
            EnumSet.of(PayOrderStatus.DRAFT, PayOrderStatus.RETURNED_TO_MAKER);

    /**
     * DRAFT | RETURNED_TO_MAKER → READY_FOR_APPROVAL.
     * Guard: makerId must match createdBy.
     */
    public PayOrder submit(String makerId) {
        if (!SUBMITTABLE.contains(this.status)) {
            throw new InvalidStatusTransitionException(this.status, "submit");
        }
        if (!makerId.equals(this.createdBy)) {
            throw new SoDViolationException(
                    "Only the original maker can submit. makerId=" + makerId
                            + ", createdBy=" + this.createdBy);
        }
        return this.toBuilder()
                .status(PayOrderStatus.READY_FOR_APPROVAL)
                .build();
    }

    /**
     * READY_FOR_APPROVAL → PENDING_APPROVER.
     * SoD: checkerId must differ from createdBy.
     */
    public PayOrder checkApprove(String checkerId) {
        if (this.status != PayOrderStatus.READY_FOR_APPROVAL) {
            throw new InvalidStatusTransitionException(this.status, "checkApprove");
        }
        if (checkerId.equals(this.createdBy)) {
            throw new SoDViolationException(
                    "Checker cannot be the same person as the maker. checkerId=" + checkerId);
        }
        return this.toBuilder()
                .status(PayOrderStatus.PENDING_APPROVER)
                .checkerId(checkerId)
                .checkerActionAt(Instant.now())
                .build();
    }

    /**
     * PENDING_APPROVER → APPROVED.
     * SoD: approverId must differ from both createdBy and checkerId.
     */
    public PayOrder approve(String approverId) {
        if (this.status != PayOrderStatus.PENDING_APPROVER) {
            throw new InvalidStatusTransitionException(this.status, "approve");
        }
        if (approverId.equals(this.createdBy)) {
            throw new SoDViolationException(
                    "Approver cannot be the same person as the maker. approverId=" + approverId);
        }
        if (approverId.equals(this.checkerId)) {
            throw new SoDViolationException(
                    "Approver cannot be the same person as the checker. approverId=" + approverId);
        }
        return this.toBuilder()
                .status(PayOrderStatus.APPROVED)
                .approverId(approverId)
                .approverActionAt(Instant.now())
                .build();
    }

    /**
     * READY_FOR_APPROVAL | PENDING_APPROVER → RETURNED_TO_MAKER.
     * Guard: reason must be at least 10 characters.
     */
    public PayOrder returnToMaker(String actorId, String reason) {
        if (!RETURNABLE.contains(this.status)) {
            throw new InvalidStatusTransitionException(this.status, "returnToMaker");
        }
        requireReason(reason, "returnToMaker");
        return this.toBuilder()
                .status(PayOrderStatus.RETURNED_TO_MAKER)
                .checkerComment(reason)
                .checkerActionAt(Instant.now())
                .build();
    }

    /**
     * READY_FOR_APPROVAL | PENDING_APPROVER → REJECTED.
     * Guard: reason must be at least 10 characters.
     */
    public PayOrder reject(String actorId, String reason) {
        if (!REJECTABLE.contains(this.status)) {
            throw new InvalidStatusTransitionException(this.status, "reject");
        }
        requireReason(reason, "reject");
        return this.toBuilder()
                .status(PayOrderStatus.REJECTED)
                .approverComment(reason)
                .approverActionAt(Instant.now())
                .build();
    }

    /**
     * DRAFT | RETURNED_TO_MAKER → DELETED.
     * Guard: makerId must match createdBy; reason must be at least 10 characters.
     */
    public PayOrder softDelete(String makerId, String reason) {
        if (!DELETABLE.contains(this.status)) {
            throw new InvalidStatusTransitionException(this.status, "softDelete");
        }
        if (!makerId.equals(this.createdBy)) {
            throw new SoDViolationException(
                    "Only the original maker can delete. makerId=" + makerId
                            + ", createdBy=" + this.createdBy);
        }
        requireReason(reason, "softDelete");
        return this.toBuilder()
                .status(PayOrderStatus.DELETED)
                .deleteReason(reason)
                .deletedBy(makerId)
                .deletedAt(Instant.now())
                .build();
    }

    /**
     * Bumps the version counter and records the updater's identity.
     * Applicable to any mutable state (DRAFT, RETURNED_TO_MAKER).
     */
    public PayOrder markUpdated(String updaterId, String ip) {
        return this.toBuilder()
                .version(this.version + 1)
                .updatedBy(updaterId)
                .updatedAt(Instant.now())
                .updatedIp(ip)
                .build();
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private static void requireReason(String reason, String action) {
        if (reason == null || reason.length() < 10) {
            throw new com.kb.ltt.domain.exception.BusinessException(
                    "MSG-ERR-VALIDATION",
                    "Action '" + action + "' requires a reason of at least 10 characters.");
        }
    }
}
