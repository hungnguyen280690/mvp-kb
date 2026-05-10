package vn.gov.kbnn.vdbas.ltt.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;
import vn.gov.kbnn.vdbas.ltt.domain.entity.LttAudit;
import vn.gov.kbnn.vdbas.ltt.domain.enums.EventType;
import vn.gov.kbnn.vdbas.ltt.domain.enums.LttState;
import vn.gov.kbnn.vdbas.ltt.outbox.OutboxWriter;
import vn.gov.kbnn.vdbas.ltt.repository.LttRepository;
import vn.gov.kbnn.vdbas.ltt.repository.LttAuditRepository;
import vn.gov.kbnn.vdbas.ltt.repository.OutboxRepository;
import vn.gov.kbnn.vdbas.ltt.statemachine.LttStateMachine;
import vn.gov.kbnn.vdbas.ltt.statemachine.TransitionResult;
import vn.gov.kbnn.vdbas.ltt.validation.ValRuleValidator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Core business service cho LTT.
 * Xu ly toan bo vong doi: create, update, submit, approve, reject, sign, send, cancel, reverse.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LttService {

    private final LttRepository lttRepository;
    private final LttAuditRepository lttAuditRepository;
    private final LttStateMachine stateMachine;
    private final ValRuleValidator valRuleValidator;
    private final FundReserveService fundReserveService;
    private final DuplicateDetector duplicateDetector;
    private final IdempotencyService idempotencyService;
    private final OutboxWriter outboxWriter;

    // =========================================================================
    // CRUD
    // =========================================================================

    @Transactional
    public Ltt create(Ltt ltt, String idempotencyKey, String userId, String userRole) {
        log.info("Creating LTT with payload: {}", ltt);
        // Kiem tra idempotency
        if (idempotencyKey != null) {
            var existing = lttRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Idempotent request: key={}, returning existing lttId={}", idempotencyKey, existing.get().getId());
                return existing.get();
            }
        }

        ltt.setIdempotencyKey(idempotencyKey);
        ltt.setState(LttState.DRAFT.name());
        ltt.setCreatedBy(userId);
        ltt.setMakerId(userId);
        ltt.setWorkingDate(LocalDate.now());
        ltt.setIsDeleted(false);
        ltt.setSoYctt(generateSoYctt());


        Ltt saved = lttRepository.save(ltt);

        // Ghi audit
        writeAudit(saved, EventType.CREATED, null, LttState.DRAFT.name(), userId, null);

        // Publish event
        outboxWriter.writeEvent(saved, EventType.CREATED, userId, userRole, null);

        return saved;
    }

    @Transactional
    public Ltt update(Long id, long version, String userId, Ltt updated) {
        Ltt existing = lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));

        // Kiem tra trang thai cho phep sua (VAL-031)
        if (!LttState.DRAFT.name().equals(existing.getState())
                && !LttState.RETURNED_TO_MAKER.name().equals(existing.getState())) {
            throw new IllegalStateException("LTT dang o trang thai [" + existing.getState() + "], khong cho phep Sua");
        }

        // Kiem tra optimistic lock (VAL-036)
        if (!existing.getVersion().equals(version)) {
            throw new IllegalStateException("Ban ghi da bi thay doi tu phien khac. Vui long tai lai truoc khi tiep tuc");
        }

        // Kiem tra Maker goc (VAL-032)
        if (!existing.getMakerId().equals(userId)) {
            throw new IllegalStateException("Chi Nguoi lap goc moi duoc phep Sua/Xoa LTT nay");
        }

        // Cap nhat cac truong (khong thay doi immutable fields: soYctt, makerId, createdAt)
        existing.setChannel(updated.getChannel());
        existing.setOrderType(updated.getOrderType());
        existing.setTxnType(updated.getTxnType());
        existing.setReceiverBankCode(updated.getReceiverBankCode());
        existing.setPaymentDate(updated.getPaymentDate());
        existing.setAmount(updated.getAmount());
        existing.setCurrency(updated.getCurrency());
        existing.setExchangeRate(updated.getExchangeRate());
        existing.setOrigDocNo(updated.getOrigDocNo());
        existing.setOrigDocDate(updated.getOrigDocDate());
        existing.setFeeType(updated.getFeeType());
        existing.setPaymentContent(updated.getPaymentContent());
        existing.setUpdatedBy(userId);

        // TODO: so sanh diff cap truong (BIZ-EDIT-AUDIT)

        Ltt saved = lttRepository.save(existing);

        writeAudit(saved, EventType.EDITED, existing.getState(), existing.getState(), userId, null);
        outboxWriter.writeEvent(saved, EventType.EDITED, userId, null, null);

        return saved;
    }

    @Transactional
    public void softDelete(Long id, long version, String userId, String reason) {
        Ltt existing = lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));

        if (!LttState.DRAFT.name().equals(existing.getState())
                && !LttState.RETURNED_TO_MAKER.name().equals(existing.getState())) {
            throw new IllegalStateException("LTT dang o trang thai [" + existing.getState() + "], khong cho phep Xoa");
        }

        if (!existing.getVersion().equals(version)) {
            throw new IllegalStateException("Ban ghi da bi thay doi tu phien khac");
        }

        if (!existing.getMakerId().equals(userId)) {
            throw new IllegalStateException("Chi Nguoi lap goc moi duoc phep Xoa");
        }

        if (reason == null || reason.length() < 10) {
            throw new IllegalArgumentException("Vui long nhap ly do toi thieu 10 ky tu");
        }

        // Soft delete
        existing.setIsDeleted(true);
        existing.setDeletedBy(userId);
        existing.setDeletedAt(OffsetDateTime.now());
        existing.setDeleteReason(reason);

        // Release hold neu co (BIZ-RELEASE-HOLD)
        if (existing.getSendRetryCount() != null && existing.getSendRetryCount() == 0) {
            fundReserveService.releaseHold(existing);
        }

        lttRepository.save(existing);

        writeAudit(existing, EventType.DELETED, existing.getState(), "(deleted)", userId, reason);
        outboxWriter.writeEvent(existing, EventType.DELETED, userId, null, reason);
    }

    // =========================================================================
    // Workflow
    // =========================================================================

    @Transactional
    public Ltt submit(Long id, String userId, String userRole) {
        Ltt ltt = lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));

        TransitionResult result = stateMachine.transition(LttState.valueOf(ltt.getState()), "SUBMIT");
        if (!result.success()) {
            throw new IllegalStateException(result.errorMessage());
        }

        // Validate day du (VAL-* rules)
        var violations = valRuleValidator.validateForSubmit(ltt);
        if (!violations.isEmpty()) {
            throw new IllegalArgumentException("Validate that bai: " + violations.size() + " loi");
        }

        // Kiem tra duplicate (BIZ-DUPLICATE)
        if (duplicateDetector.isDuplicate(ltt)) {
            log.warn("Duplicate LTT detected: lttId={}", ltt.getId());
            // Van cho di nhung canh bao
        }

        String previousState = ltt.getState();
        ltt.setState(LttState.SUBMITTED.name());
        ltt.setUpdatedBy(userId);

        // Dat giu quy (BIZ-RESERVE-FUND)
        fundReserveService.reserveFund(ltt);

        Ltt saved = lttRepository.save(ltt);

        writeAudit(saved, EventType.SUBMITTED, previousState, LttState.SUBMITTED.name(), userId, null);
        outboxWriter.writeEvent(saved, EventType.SUBMITTED, userId, userRole, null);

        return saved;
    }

    @Transactional
    public Ltt approve(Long id, String userId, String userRole) {
        Ltt ltt = lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));

        String currentState = ltt.getState();
        String event;
        String targetState;

        // Xac dinh loai approve: Checker hay Approver
        if (LttState.SUBMITTED.name().equals(currentState)) {
            event = "APPROVE_CHECK";
            targetState = LttState.IN_CONTROL.name();
            // SoD: Checker != Maker
            if (ltt.getMakerId().equals(userId)) {
                throw new IllegalStateException("Checker khong duoc trung Maker (SOD-001)");
            }
            ltt.setCheckerId(userId);
            ltt.setCheckerName(userId);
            ltt.setCheckedAt(OffsetDateTime.now());
        } else if (LttState.IN_CONTROL.name().equals(currentState)) {
            event = "APPROVE";
            targetState = LttState.APPROVED.name();
            // SoD: Approver != Checker != Maker
            if (userId.equals(ltt.getCheckerId())) {
                throw new IllegalStateException("Approver khong duoc trung Checker (SOD-002)");
            }
            if (userId.equals(ltt.getMakerId())) {
                throw new IllegalStateException("Approver khong duoc trung Maker (SOD-003)");
            }
            ltt.setApproverId(userId);
            ltt.setApproverName(userId);
            ltt.setApprovedAt(OffsetDateTime.now());
        } else {
            throw new IllegalStateException("LTT dang o trang thai [" + currentState + "], khong cho phep Approve");
        }

        TransitionResult result = stateMachine.transition(LttState.valueOf(currentState), event);
        if (!result.success()) {
            throw new IllegalStateException(result.errorMessage());
        }

        ltt.setState(targetState);
        ltt.setUpdatedBy(userId);
        Ltt saved = lttRepository.save(ltt);

        EventType eventType = LttState.SUBMITTED.name().equals(currentState)
                ? EventType.CHECK_APPROVED : EventType.APPROVED;
        writeAudit(saved, eventType, currentState, targetState, userId, null);
        outboxWriter.writeEvent(saved, eventType, userId, userRole, null);

        return saved;
    }

    @Transactional
    public Ltt reject(Long id, String userId, String userRole, String reason) {
        Ltt ltt = lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));

        if (reason == null || reason.length() < 10 || reason.length() > 500) {
            throw new IllegalArgumentException("Ly do tu choi phai tu 10-500 ky tu (VAL-030)");
        }

        String currentState = ltt.getState();
        TransitionResult result = stateMachine.transition(LttState.valueOf(currentState), "REJECT");
        if (!result.success()) {
            throw new IllegalStateException(result.errorMessage());
        }

        String targetState = result.targetState();
        ltt.setState(targetState);
        ltt.setRejectReason(reason);
        ltt.setRejectedBy(userId);
        ltt.setRejectedAt(OffsetDateTime.now());
        ltt.setUpdatedBy(userId);

        // Release hold (BIZ-RELEASE-HOLD)
        fundReserveService.releaseHold(ltt);

        Ltt saved = lttRepository.save(ltt);

        writeAudit(saved, EventType.REJECTED, currentState, targetState, userId, reason);
        outboxWriter.writeEvent(saved, EventType.REJECTED, userId, userRole, reason);

        return saved;
    }

    @Transactional
    public Ltt sign(Long id, String userId, String userRole, String signatureData, String signerCert) {
        Ltt ltt = lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));

        String currentState = ltt.getState();
        TransitionResult result = stateMachine.transition(LttState.valueOf(currentState), "SIGN");
        if (!result.success()) {
            throw new IllegalStateException(result.errorMessage());
        }

        // TODO: Verify certificate (BIZ-SIGN-TAD-COMM)

        ltt.setState(LttState.SIGNED.name());
        ltt.setUpdatedBy(userId);

        Ltt saved = lttRepository.save(ltt);

        writeAudit(saved, EventType.SIGNED, currentState, LttState.SIGNED.name(), userId, null);
        outboxWriter.writeEvent(saved, EventType.SIGNED, userId, userRole, null);

        return saved;
    }

    @Transactional
    public Ltt send(Long id, String userId, String userRole) {
        Ltt ltt = lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));

        String currentState = ltt.getState();
        TransitionResult result = stateMachine.transition(LttState.valueOf(currentState), "SEND");
        if (!result.success()) {
            throw new IllegalStateException(result.errorMessage());
        }

        // Dinh tuyen kenh (BIZ-CHANNEL-ROUTING)
        ltt.setCorrelationId(UUID.randomUUID().toString());
        ltt.setState(LttState.SENT.name());
        ltt.setUpdatedBy(userId);

        Ltt saved = lttRepository.save(ltt);

        writeAudit(saved, EventType.SENT, currentState, LttState.SENT.name(), userId, null);
        outboxWriter.writeEvent(saved, EventType.SENT, userId, userRole, null);

        return saved;
    }

    @Transactional
    public Ltt cancel(Long id, String userId, String userRole, String reason) {
        Ltt ltt = lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));

        if (reason == null || reason.length() < 10 || reason.length() > 500) {
            throw new IllegalArgumentException("Ly do huy phai tu 10-500 ky tu (VAL-030)");
        }

        String currentState = ltt.getState();
        TransitionResult result = stateMachine.transition(LttState.valueOf(currentState), "CANCEL");
        if (!result.success()) {
            throw new IllegalStateException(result.errorMessage());
        }

        ltt.setState(LttState.CANCELLED.name());
        ltt.setCancelReason(reason);
        ltt.setCancelledBy(userId);
        ltt.setCancelledAt(OffsetDateTime.now());
        ltt.setUpdatedBy(userId);

        // Release hold (BIZ-RELEASE-HOLD)
        fundReserveService.releaseHold(ltt);

        Ltt saved = lttRepository.save(ltt);

        writeAudit(saved, EventType.CANCELLED, currentState, LttState.CANCELLED.name(), userId, reason);
        outboxWriter.writeEvent(saved, EventType.CANCELLED, userId, userRole, reason);

        return saved;
    }

    @Transactional
    public Ltt reverse(Long id, String userId, String userRole, String reason) {
        Ltt ltt = lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));

        String currentState = ltt.getState();
        TransitionResult result = stateMachine.transition(LttState.valueOf(currentState), "REVERSE");
        if (!result.success()) {
            throw new IllegalStateException(result.errorMessage());
        }

        // SoD: Approver dao phai khac Approver goc (SOD-005)
        if (userId.equals(ltt.getApproverId())) {
            throw new IllegalStateException("Nguoi dao phai khac Approver goc (SOD-005)");
        }

        ltt.setState(LttState.REVERSED.name());
        ltt.setUpdatedBy(userId);

        // TODO: Tao LTT dao moi

        Ltt saved = lttRepository.save(ltt);

        writeAudit(saved, EventType.REVERSED, currentState, LttState.REVERSED.name(), userId, reason);
        outboxWriter.writeEvent(saved, EventType.REVERSED, userId, userRole, reason);

        return saved;
    }

    // =========================================================================
    // Callback
    // =========================================================================

    @Transactional
    public Ltt processCallback(String correlationId, String status, String errorCode, String errorMessage,
                                String providerRefId) {
        Ltt ltt = lttRepository.findByCorrelationId(correlationId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT voi correlationId: " + correlationId));

        if (!LttState.SENT.name().equals(ltt.getState())) {
            log.warn("Callback cho LTT khong o trang thai SENT: lttId={}, state={}", ltt.getId(), ltt.getState());
            return ltt;
        }

        String event;
        String targetState;

        if ("SUCCESS".equals(status)) {
            event = "CALLBACK_SUCCESS";
            targetState = LttState.CONFIRMED.name();
        } else {
            event = "CALLBACK_FAIL";
            targetState = LttState.SEND_FAILED.name();
        }

        TransitionResult result = stateMachine.transition(LttState.SENT, event);
        if (!result.success()) {
            throw new IllegalStateException(result.errorMessage());
        }

        ltt.setState(targetState);
        ltt.setExtReference(providerRefId);
        ltt.setUpdatedBy("SYSTEM");

        if ("FAIL".equals(status) || "TIMEOUT".equals(status)) {
            fundReserveService.releaseHold(ltt);
        }

        Ltt saved = lttRepository.save(ltt);

        EventType eventType = "SUCCESS".equals(status) ? EventType.CONFIRMED : EventType.SEND_FAILED;
        writeAudit(saved, eventType, LttState.SENT.name(), targetState, "SYSTEM", errorMessage);
        outboxWriter.writeEvent(saved, eventType, "SYSTEM", "SYSTEM", errorMessage);

        return saved;
    }

    // =========================================================================
    // Query
    // =========================================================================

    @Transactional(readOnly = true)
    public Ltt getById(Long id) {
        return lttRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay LTT: " + id));
    }

    @Transactional(readOnly = true)
    public Page<Ltt> search(String channel, String orderType, String status, String unitCode,
                            LocalDate paymentDateFrom, LocalDate paymentDateTo, String requestNumber,
                            String senderBankCode, String receiverBankCode, BigDecimal amountFrom,
                            BigDecimal amountTo, int page, int size) {
        return lttRepository.search(
                channel, orderType, status, unitCode, paymentDateFrom, paymentDateTo,
                requestNumber, senderBankCode, receiverBankCode, amountFrom, amountTo,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "paymentDate")));
    }

    @Transactional(readOnly = true)
    public Page<LttAudit> getAuditTrail(Long lttId, int page, int size) {
        return lttAuditRepository.findByLttIdOrderByPerformedAtDesc(lttId, PageRequest.of(page, size));
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private void writeAudit(Ltt ltt, EventType eventType, String stateFrom, String stateTo,
                            String userId, String reason) {
        LttAudit audit = LttAudit.builder()
                .lttId(ltt.getId())
                .action(eventType.name())
                .stateFrom(stateFrom)
                .stateTo(stateTo)
                .performedBy(userId)
                .performedAt(OffsetDateTime.now())
                .versionFrom(ltt.getVersion() > 0 ? ltt.getVersion() - 1 : 0)
                .versionTo(ltt.getVersion())
                .reason(reason)
                .build();
        lttAuditRepository.save(audit);
    }

    private String generateSoYctt() {
        // TODO: Implement sophisticated SO_YCTT generation rule, e.g., from a sequence.
        // For now, using a simple timestamp-based unique string.
        return "YCTT" + System.currentTimeMillis();
    }
}
