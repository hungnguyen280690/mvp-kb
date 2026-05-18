package com.kb.ltt.domain.service;

import com.kb.ltt.domain.model.LttApprovalRequest;
import com.kb.ltt.domain.model.LttCreateRequest;
import com.kb.ltt.domain.model.LttDeleteRequest;
import com.kb.ltt.domain.model.LttDetail;
import com.kb.ltt.domain.model.LttDetailResponse;
import com.kb.ltt.domain.model.LttFilterRequest;
import com.kb.ltt.domain.model.LttHeader;
import com.kb.ltt.domain.model.LttReceiver;
import com.kb.ltt.domain.model.LttSender;
import com.kb.ltt.domain.model.LttStatus;
import com.kb.ltt.domain.model.LttUpdateRequest;
import com.kb.ltt.domain.port.inbound.LttService;
import com.kb.ltt.domain.port.outbound.AuditEventPublisher;
import com.kb.ltt.domain.port.outbound.LttRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Domain service implementation for LTT operations.
 * Contains all business rules (BIZ-001 to BIZ-010) and state machine validation.
 *
 * // FT-001: Core LTT domain service
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LttServiceImpl implements LttService {

    private final LttRepository lttRepository;
    private final AuditEventPublisher auditEventPublisher;

    // --- Amount threshold for high-value transactions (BIZ-010, VAL-12) ---
    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("500000000");

    // ========================================================================
    // listLtt - LTT.LIST.VIEW
    // ========================================================================

    /**
     * List LTTs with filtering and pagination.
     * Read-only operation; no state changes.
     *
     * @param filter   search criteria
     * @param pageable pagination parameters
     * @return paginated results
     */
    @Override
    @Transactional(readOnly = true)
    public Page<LttHeader> listLtt(LttFilterRequest filter, Pageable pageable) {
        // Rule 3.4: Guard clause
        if (filter == null) {
            filter = LttFilterRequest.builder().build();
        }
        if (pageable == null) {
            throw new IllegalArgumentException("Pageable must not be null");
        }
        log.info("LTT.LIST.VIEW - Listing LTTs with filter: {}", filter);
        // Delegated to infrastructure for dynamic query building
        // The actual spec-driven filtering is in LttRepositoryImpl
        return lttRepository.searchHeaders(filter, pageable);
    }

    // ========================================================================
    // getLttDetail - LTT.VIEW.OPEN
    // ========================================================================

    /**
     * Get full detail of an LTT: header + details + sender + receiver.
     *
     * @param id the LTT F_ID
     * @return composite response
     */
    @Override
    @Transactional(readOnly = true)
    public LttDetailResponse getLttDetail(Long id) {
        // Rule 3.4: Guard clause
        if (id == null) {
            throw new IllegalArgumentException("LTT ID must not be null");
        }

        log.info("LTT.VIEW.OPEN - Fetching LTT detail for id: {}", id);

        LttHeader header = lttRepository.findHeaderById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "LTT not found with id: " + id));

        List<LttDetail> details = lttRepository.findDetailsByLttId(id);
        LttSender sender = lttRepository.findSenderByLttId(id).orElse(null);
        LttReceiver receiver = lttRepository.findReceiverByLttId(id).orElse(null);

        return LttDetailResponse.builder()
                .header(header)
                .details(details)
                .sender(sender)
                .receiver(receiver)
                .build();
    }

    // ========================================================================
    // createLtt - LTT.NEW.SAVE
    // ========================================================================

    /**
     * Create a new LTT in DRAFT status.
     *
     * // BIZ-002: New record starts as DRAFT, createdBy = current user
     * // Rule 2.3: Idempotency key check
     * // BIZ-004: Detail sum must equal header amount
     *
     * @param request create payload
     * @param userId  the maker creating the LTT
     * @return created header
     */
    @Override
    public LttHeader createLtt(LttCreateRequest request, String userId) {
        // Rule 3.4: Guard clauses
        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID must not be empty");
        }

        log.info("LTT.NEW.SAVE - Creating LTT by user: {}", userId);

        // Rule 2.3: Idempotency - check for duplicate request
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            lttRepository.findHeaderByIdempotencyKey(request.getIdempotencyKey())
                    .ifPresent(existing -> {
                        log.warn("Duplicate request detected for idempotency key: {}",
                                request.getIdempotencyKey());
                        throw new IllegalStateException(
                                "Duplicate request: LTT already exists with this idempotency key");
                    });
        }

        // BIZ-004: Validate detail amount sum equals header amount (if details provided)
        validateDetailAmounts(request.getDetails(), request.getAmount());

        // Build and save header
        LocalDateTime now = LocalDateTime.now();
        LttHeader header = LttHeader.builder()
                .refNo(request.getRefNo())
                .channel(request.getChannel())
                .transactionType(request.getTransactionType())
                .lnhTransactionType(request.getLnhTransactionType())
                .senderCode(request.getSenderCode())
                .receiverCode(request.getReceiverCode())
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : now.toLocalDate())
                .amount(request.getAmount())
                .currencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "VND")
                .exchangeRate(request.getExchangeRate())
                .originNum(request.getOriginNum())
                .transactionDate(request.getTransactionDate())
                .expType(request.getExpType())
                .fnCode1(request.getFnCode1())
                .fnCode2(request.getFnCode2())
                .fnAmount(request.getFnAmount())
                .description(request.getDescription())
                .fStatus(LttStatus.DRAFT) // BIZ-002: Always starts as DRAFT
                .fVer(1)
                .createdBy(userId) // BIZ-008: Audit field
                .createdDate(now) // BIZ-008: Audit field
                .idempotencyKey(request.getIdempotencyKey())
                .build();

        LttHeader savedHeader = lttRepository.saveHeader(header);

        // Save detail lines
        if (request.getDetails() != null && !request.getDetails().isEmpty()) {
            List<LttDetail> details = buildDetailEntities(savedHeader.getFId(), request.getDetails());
            lttRepository.saveAllDetails(details);
        }

        // Save sender info
        if (request.getSender() != null) {
            LttSender sender = buildSenderEntity(savedHeader.getFId(), request.getSender());
            lttRepository.saveSender(sender);
        }

        // Save receiver info
        if (request.getReceiver() != null) {
            LttReceiver receiver = buildReceiverEntity(savedHeader.getFId(), request.getReceiver());
            lttRepository.saveReceiver(receiver);
        }

        // BIZ-007: Audit trail
        auditEventPublisher.publishAuditEvent(
                "LTT.NEW.SAVE", savedHeader.getFId(), userId,
                null, LttStatus.DRAFT.getCode(),
                "Created new LTT", null);

        log.info("LTT.NEW.SAVE - Created LTT id: {}, refNo: {}", savedHeader.getFId(), savedHeader.getRefNo());
        return savedHeader;
    }

    // ========================================================================
    // updateLtt - LTT.EDIT.SAVE
    // ========================================================================

    /**
     * Update an existing LTT.
     *
     * // BIZ-002: Only original Maker can edit
     * // VAL-13: Only DRAFT/RETURNED_TO_MAKER allowed
     * // VAL-14: Maker ownership check
     * // VAL-15: Optimistic lock check via fVer
     * // BIZ-004: Detail sum must equal header amount
     *
     * @param id      the LTT F_ID
     * @param request update payload with fVer
     * @param userId  the user performing update
     * @return updated header
     */
    @Override
    public LttHeader updateLtt(Long id, LttUpdateRequest request, String userId) {
        // Rule 3.4: Guard clauses
        if (id == null) {
            throw new IllegalArgumentException("LTT ID must not be null");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID must not be empty");
        }

        log.info("LTT.EDIT.SAVE - Updating LTT id: {} by user: {}", id, userId);

        LttHeader header = lttRepository.findHeaderById(id)
                .orElseThrow(() -> new IllegalArgumentException("LTT not found with id: " + id));

        // VAL-13: Status check - only DRAFT or RETURNED_TO_MAKER can be edited
        validateEditableStatus(header.getFStatus(), "update");

        // VAL-14: Maker ownership check (BIZ-002)
        validateMakerOwnership(header, userId);

        // VAL-15: Optimistic lock check
        validateOptimisticLock(header, request.getFVer());

        // BIZ-004: Validate detail amounts
        validateDetailAmounts(request.getDetails(), request.getAmount());

        // Update header fields
        updateHeaderFields(header, request, userId);

        LttHeader savedHeader = lttRepository.saveHeader(header);

        // Replace detail lines (delete old, insert new)
        if (request.getDetails() != null) {
            lttRepository.deleteDetailsByLttId(id);
            List<LttDetail> details = buildDetailEntitiesFromUpdate(id, request.getDetails());
            lttRepository.saveAllDetails(details);
        }

        // Replace sender info
        if (request.getSender() != null) {
            lttRepository.findSenderByLttId(id).ifPresentOrElse(
                    existing -> updateSenderFields(existing, request.getSender()),
                    () -> lttRepository.saveSender(
                            buildSenderEntity(id, request.getSender()))
            );
        }

        // Replace receiver info
        if (request.getReceiver() != null) {
            lttRepository.findReceiverByLttId(id).ifPresentOrElse(
                    existing -> updateReceiverFields(existing, request.getReceiver()),
                    () -> lttRepository.saveReceiver(
                            buildReceiverEntity(id, request.getReceiver()))
            );
        }

        // BIZ-007: Audit trail
        auditEventPublisher.publishAuditEvent(
                "LTT.EDIT.SAVE", savedHeader.getFId(), userId,
                header.getFStatus().getCode(), header.getFStatus().getCode(),
                "Updated LTT", null);

        log.info("LTT.EDIT.SAVE - Updated LTT id: {}, new fVer: {}", savedHeader.getFId(), savedHeader.getFVer());
        return savedHeader;
    }

    // ========================================================================
    // deleteLtt - LTT.DELETE.CONFIRM
    // ========================================================================

    /**
     * Soft-delete an LTT.
     *
     * // BIZ-003: Soft-delete, F_STATUS = DELETED
     * // VAL-13: Only DRAFT/RETURNED_TO_MAKER allowed
     * // VAL-14: Maker ownership check
     * // VAL-15: Optimistic lock check
     * // VAL-16: Delete reason >= 10 chars
     *
     * @param id      the LTT F_ID
     * @param request contains deleteReason and fVer
     * @param userId  the user performing delete
     */
    @Override
    public void deleteLtt(Long id, LttDeleteRequest request, String userId) {
        // Rule 3.4: Guard clauses
        if (id == null) {
            throw new IllegalArgumentException("LTT ID must not be null");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID must not be empty");
        }

        log.info("LTT.DELETE.CONFIRM - Deleting LTT id: {} by user: {}", id, userId);

        // VAL-16: Delete reason validation (BIZ-006)
        if (request.getDeleteReason() == null || request.getDeleteReason().length() < 10) {
            throw new IllegalArgumentException("Delete reason must be at least 10 characters");
        }
        if (request.getDeleteReason().length() > 500) {
            throw new IllegalArgumentException("Delete reason must not exceed 500 characters");
        }

        LttHeader header = lttRepository.findHeaderById(id)
                .orElseThrow(() -> new IllegalArgumentException("LTT not found with id: " + id));

        // VAL-13: Status check
        validateEditableStatus(header.getFStatus(), "delete");

        // VAL-14: Maker ownership check (BIZ-002)
        validateMakerOwnership(header, userId);

        // VAL-15: Optimistic lock check
        validateOptimisticLock(header, request.getFVer());

        // BIZ-003: Soft-delete - set status to DELETED
        LttStatus previousStatus = header.getFStatus();
        header.setFStatus(LttStatus.DELETED);
        header.setDeletedBy(userId);
        header.setDeletedDate(LocalDateTime.now());
        header.setDeleteReason(request.getDeleteReason());

        lttRepository.saveHeader(header);

        // BIZ-007: Audit trail
        auditEventPublisher.publishAuditEvent(
                "LTT.DELETE.CONFIRM", header.getFId(), userId,
                previousStatus.getCode(), LttStatus.DELETED.getCode(),
                request.getDeleteReason(), null);

        log.info("LTT.DELETE.CONFIRM - Deleted LTT id: {}", id);
    }

    // ========================================================================
    // submitLtt - LTT.NEW.SUBMIT
    // ========================================================================

    /**
     * Submit an LTT for Checker review.
     * Transition: DRAFT/RETURNED_TO_MAKER -> READY_FOR_APPROVAL
     *
     * // VAL-13: Only DRAFT/RETURNED_TO_MAKER allowed
     * // VAL-14: Maker ownership check
     * // BIZ-004: Detail sum must equal header amount (full validation on submit)
     *
     * @param id     the LTT F_ID
     * @param userId the user submitting (must be Maker)
     */
    @Override
    public void submitLtt(Long id, String userId) {
        // Rule 3.4: Guard clauses
        if (id == null) {
            throw new IllegalArgumentException("LTT ID must not be null");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID must not be empty");
        }

        log.info("LTT.NEW.SUBMIT - Submitting LTT id: {} by user: {}", id, userId);

        LttHeader header = lttRepository.findHeaderById(id)
                .orElseThrow(() -> new IllegalArgumentException("LTT not found with id: " + id));

        // VAL-13: Status check - only DRAFT or RETURNED_TO_MAKER can be submitted
        validateSubmittableStatus(header.getFStatus());

        // VAL-14: Maker ownership check (BIZ-002)
        validateMakerOwnership(header, userId);

        // BIZ-004: Validate detail amounts on submit (full validation)
        List<LttDetail> details = lttRepository.findDetailsByLttId(id);
        validateDetailAmountSum(details, header.getAmount());

        // State transition: DRAFT/RETURNED_TO_MAKER -> READY_FOR_APPROVAL
        LttStatus previousStatus = header.getFStatus();
        header.setFStatus(LttStatus.READY_FOR_APPROVAL);
        header.setUpdatedBy(userId);
        header.setUpdatedDate(LocalDateTime.now());

        lttRepository.saveHeader(header);

        // BIZ-007: Audit trail
        // BIZ-009: Notification would be sent to Checker (delegated to infrastructure)
        auditEventPublisher.publishAuditEvent(
                "LTT.NEW.SUBMIT", header.getFId(), userId,
                previousStatus.getCode(), LttStatus.READY_FOR_APPROVAL.getCode(),
                "Submitted for Checker review", null);

        log.info("LTT.NEW.SUBMIT - Submitted LTT id: {} -> READY_FOR_APPROVAL", id);
    }

    // ========================================================================
    // checkLtt - LTT.APPROVE.CHECKER
    // ========================================================================

    /**
     * Checker reviews an LTT.
     *
     * Transitions:
     *   APPROVE -> READY_FOR_APPROVAL -> PENDING_APPROVER
     *   RETURN  -> READY_FOR_APPROVAL -> RETURNED_TO_MAKER
     *   REJECT  -> READY_FOR_APPROVAL -> REJECTED
     *
     * // BIZ-001: SoD enforcement - checker != maker
     * // BIZ-006: Note >= 10 chars when RETURN/REJECT
     *
     * @param id      the LTT F_ID
     * @param request action and note
     * @param userId  the Checker user
     */
    @Override
    public void checkLtt(Long id, LttApprovalRequest request, String userId) {
        // Rule 3.4: Guard clauses
        if (id == null) {
            throw new IllegalArgumentException("LTT ID must not be null");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID must not be empty");
        }

        log.info("LTT.APPROVE.CHECKER - Checking LTT id: {} by user: {}", id, userId);

        LttHeader header = lttRepository.findHeaderById(id)
                .orElseThrow(() -> new IllegalArgumentException("LTT not found with id: " + id));

        // State guard: must be READY_FOR_APPROVAL for Checker action
        if (header.getFStatus() != LttStatus.READY_FOR_APPROVAL) {
            throw new IllegalStateException(
                    "LTT must be in READY_FOR_APPROVAL status for Checker review. Current: "
                            + header.getFStatus().getCode());
        }

        // BIZ-001: SoD enforcement - Checker cannot be the same as Maker
        validateSoDChecker(header, userId);

        // BIZ-006: Note required for RETURN and REJECT
        validateApprovalNote(request);

        LttStatus previousStatus = header.getFStatus();
        String eventType;

        switch (request.getAction()) {
            case APPROVE:
                // READY_FOR_APPROVAL -> PENDING_APPROVER
                header.setFStatus(LttStatus.PENDING_APPROVER);
                header.setCheckedBy(userId);
                header.setCheckedDate(LocalDateTime.now());
                eventType = "LTT.APPROVE.CHECKER";
                break;

            case RETURN:
                // READY_FOR_APPROVAL -> RETURNED_TO_MAKER
                header.setFStatus(LttStatus.RETURNED_TO_MAKER);
                header.setCheckedBy(userId);
                header.setCheckedDate(LocalDateTime.now());
                eventType = "LTT.APPROVE.RETURN";
                break;

            case REJECT:
                // READY_FOR_APPROVAL -> REJECTED
                header.setFStatus(LttStatus.REJECTED);
                header.setCheckedBy(userId);
                header.setCheckedDate(LocalDateTime.now());
                eventType = "LTT.APPROVE.REJECT";
                break;

            default:
                throw new IllegalArgumentException("Unknown approval action: " + request.getAction());
        }

        header.setUpdatedBy(userId);
        header.setUpdatedDate(LocalDateTime.now());
        lttRepository.saveHeader(header);

        // BIZ-007: Audit trail
        // BIZ-009: Notification to next actor (Maker for return/reject, Approver for approve)
        auditEventPublisher.publishAuditEvent(
                eventType, header.getFId(), userId,
                previousStatus.getCode(), header.getFStatus().getCode(),
                request.getNote(), null);

        log.info("LTT.APPROVE.CHECKER - LTT id: {} action: {} -> {}",
                id, request.getAction(), header.getFStatus().getCode());
    }

    // ========================================================================
    // approveLtt - LTT.APPROVE.APPROVER
    // ========================================================================

    /**
     * Approver reviews an LTT.
     *
     * Transitions:
     *   APPROVE -> PENDING_APPROVER -> APPROVED
     *   RETURN  -> PENDING_APPROVER -> RETURNED_TO_MAKER
     *   REJECT  -> PENDING_APPROVER -> REJECTED
     *
     * // BIZ-001: SoD enforcement - approver != maker && approver != checker
     * // BIZ-006: Note >= 10 chars when RETURN/REJECT
     * // BIZ-010: Limit check for high-value transactions
     *
     * @param id      the LTT F_ID
     * @param request action and note
     * @param userId  the Approver user
     */
    @Override
    public void approveLtt(Long id, LttApprovalRequest request, String userId) {
        // Rule 3.4: Guard clauses
        if (id == null) {
            throw new IllegalArgumentException("LTT ID must not be null");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request must not be null");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID must not be empty");
        }

        log.info("LTT.APPROVE.APPROVER - Approving LTT id: {} by user: {}", id, userId);

        LttHeader header = lttRepository.findHeaderById(id)
                .orElseThrow(() -> new IllegalArgumentException("LTT not found with id: " + id));

        // State guard: must be PENDING_APPROVER for Approver action
        if (header.getFStatus() != LttStatus.PENDING_APPROVER) {
            throw new IllegalStateException(
                    "LTT must be in PENDING_APPROVER status for Approver review. Current: "
                            + header.getFStatus().getCode());
        }

        // BIZ-001: SoD enforcement - Approver cannot be Maker or Checker
        validateSoDApprover(header, userId);

        // BIZ-006: Note required for RETURN and REJECT
        validateApprovalNote(request);

        // BIZ-010: High-value transaction check (warning only, does not block)
        if (request.getAction() == LttApprovalRequest.ApprovalAction.APPROVE
                && header.getAmount() != null
                && header.getAmount().compareTo(HIGH_VALUE_THRESHOLD) >= 0) {
            log.warn("BIZ-010: High-value LTT approved - id: {}, amount: {}",
                    id, header.getAmount());
        }

        LttStatus previousStatus = header.getFStatus();
        String eventType;

        switch (request.getAction()) {
            case APPROVE:
                // PENDING_APPROVER -> APPROVED
                header.setFStatus(LttStatus.APPROVED);
                header.setApprovedBy(userId);
                header.setApprovedDate(LocalDateTime.now());
                eventType = "LTT.APPROVE.APPROVER";
                break;

            case RETURN:
                // PENDING_APPROVER -> RETURNED_TO_MAKER
                header.setFStatus(LttStatus.RETURNED_TO_MAKER);
                header.setApprovedBy(userId);
                header.setApprovedDate(LocalDateTime.now());
                eventType = "LTT.APPROVE.RETURN";
                break;

            case REJECT:
                // PENDING_APPROVER -> REJECTED
                header.setFStatus(LttStatus.REJECTED);
                header.setApprovedBy(userId);
                header.setApprovedDate(LocalDateTime.now());
                eventType = "LTT.APPROVE.REJECT";
                break;

            default:
                throw new IllegalArgumentException("Unknown approval action: " + request.getAction());
        }

        header.setUpdatedBy(userId);
        header.setUpdatedDate(LocalDateTime.now());
        lttRepository.saveHeader(header);

        // BIZ-007: Audit trail
        // BIZ-009: Notification to Maker
        auditEventPublisher.publishAuditEvent(
                eventType, header.getFId(), userId,
                previousStatus.getCode(), header.getFStatus().getCode(),
                request.getNote(), null);

        log.info("LTT.APPROVE.APPROVER - LTT id: {} action: {} -> {}",
                id, request.getAction(), header.getFStatus().getCode());
    }

    // ========================================================================
    // copyLtt - LTT.NEW.COPY
    // ========================================================================

    /**
     * Copy an existing LTT to create a new DRAFT.
     * New record gets a new F_ID, F_STATUS=DRAFT, F_VER=1, createdBy=currentUser.
     *
     * @param id     the source LTT F_ID
     * @param userId the user performing the copy
     * @return the new copied LTT header
     */
    @Override
    public LttHeader copyLtt(Long id, String userId) {
        // Rule 3.4: Guard clauses
        if (id == null) {
            throw new IllegalArgumentException("LTT ID must not be null");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID must not be empty");
        }

        log.info("LTT.NEW.COPY - Copying LTT id: {} by user: {}", id, userId);

        LttHeader sourceHeader = lttRepository.findHeaderById(id)
                .orElseThrow(() -> new IllegalArgumentException("LTT not found with id: " + id));

        LocalDateTime now = LocalDateTime.now();

        // Create new header with copied data, new identity
        LttHeader newHeader = LttHeader.builder()
                .refNo(sourceHeader.getRefNo())
                .channel(sourceHeader.getChannel())
                .transactionType(sourceHeader.getTransactionType())
                .lnhTransactionType(sourceHeader.getLnhTransactionType())
                .senderCode(sourceHeader.getSenderCode())
                .receiverCode(sourceHeader.getReceiverCode())
                .paymentDate(now.toLocalDate())
                .amount(sourceHeader.getAmount())
                .currencyCode(sourceHeader.getCurrencyCode())
                .exchangeRate(sourceHeader.getExchangeRate())
                .originNum(sourceHeader.getOriginNum())
                .transactionDate(sourceHeader.getTransactionDate())
                .expType(sourceHeader.getExpType())
                .fnCode1(sourceHeader.getFnCode1())
                .fnCode2(sourceHeader.getFnCode2())
                .fnAmount(sourceHeader.getFnAmount())
                .description(sourceHeader.getDescription())
                .fStatus(LttStatus.DRAFT) // Always DRAFT for new copy
                .fVer(1) // Fresh version
                .createdBy(userId) // New owner
                .createdDate(now)
                .build();

        LttHeader savedHeader = lttRepository.saveHeader(newHeader);

        // Copy detail lines with new LTT ID
        List<LttDetail> sourceDetails = lttRepository.findDetailsByLttId(id);
        if (!sourceDetails.isEmpty()) {
            List<LttDetail> newDetails = new ArrayList<>();
            for (int i = 0; i < sourceDetails.size(); i++) {
                LttDetail src = sourceDetails.get(i);
                newDetails.add(LttDetail.builder()
                        .lttId(savedHeader.getFId())
                        .lineNo(i + 1)
                        .glSegment1(src.getGlSegment1())
                        .glSegment2(src.getGlSegment2())
                        .glSegment3(src.getGlSegment3())
                        .glSegment4(src.getGlSegment4())
                        .glSegment5(src.getGlSegment5())
                        .glSegment6(src.getGlSegment6())
                        .glSegment7(src.getGlSegment7())
                        .glSegment8(src.getGlSegment8())
                        .glSegment9(src.getGlSegment9())
                        .glSegment10(src.getGlSegment10())
                        .glSegment11(src.getGlSegment11())
                        .glSegment12(src.getGlSegment12())
                        .description(src.getDescription())
                        .amount(src.getAmount())
                        .build());
            }
            lttRepository.saveAllDetails(newDetails);
        }

        // Copy sender info
        lttRepository.findSenderByLttId(id).ifPresent(srcSender -> {
            LttSender newSender = LttSender.builder()
                    .lttId(savedHeader.getFId())
                    .senderName(srcSender.getSenderName())
                    .senderAddress(srcSender.getSenderAddress())
                    .senderGlSegment2(srcSender.getSenderGlSegment2())
                    .senderNum(srcSender.getSenderNum())
                    .senderBankCode(srcSender.getSenderBankCode())
                    .senderIdentifyId(srcSender.getSenderIdentifyId())
                    .senderIssuedDate(srcSender.getSenderIssuedDate())
                    .senderIssuedPlace(srcSender.getSenderIssuedPlace())
                    .tpcpCode(srcSender.getTpcpCode())
                    .build();
            lttRepository.saveSender(newSender);
        });

        // Copy receiver info
        lttRepository.findReceiverByLttId(id).ifPresent(srcReceiver -> {
            LttReceiver newReceiver = LttReceiver.builder()
                    .lttId(savedHeader.getFId())
                    .receiverName(srcReceiver.getReceiverName())
                    .receiverAddress(srcReceiver.getReceiverAddress())
                    .receiverGlSegment2(srcReceiver.getReceiverGlSegment2())
                    .receiverBankName(srcReceiver.getReceiverBankName())
                    .receiverBankCode(srcReceiver.getReceiverBankCode())
                    .receiverIdentifyId(srcReceiver.getReceiverIdentifyId())
                    .receiverIssuedDate(srcReceiver.getReceiverIssuedDate())
                    .receiverIssuedPlace(srcReceiver.getReceiverIssuedPlace())
                    .build();
            lttRepository.saveReceiver(newReceiver);
        });

        // BIZ-007: Audit trail
        auditEventPublisher.publishAuditEvent(
                "LTT.NEW.COPY", savedHeader.getFId(), userId,
                null, LttStatus.DRAFT.getCode(),
                "Copied from LTT id: " + id, null);

        log.info("LTT.NEW.COPY - Copied LTT from id: {} to new id: {}", id, savedHeader.getFId());
        return savedHeader;
    }

    // ========================================================================
    // Private validation methods
    // ========================================================================

    /**
     * // VAL-13: Validate that the LTT is in an editable status.
     * Only DRAFT and RETURNED_TO_MAKER can be edited or deleted.
     */
    private void validateEditableStatus(LttStatus status, String operation) {
        if (status != LttStatus.DRAFT && status != LttStatus.RETURNED_TO_MAKER) {
            throw new IllegalStateException(
                    "Cannot " + operation + " LTT in status: " + status.getCode()
                            + ". Only DRAFT or RETURNED_TO_MAKER are allowed.");
        }
    }

    /**
     * Validate that the LTT is in a submittable status.
     * Only DRAFT and RETURNED_TO_MAKER can be submitted.
     */
    private void validateSubmittableStatus(LttStatus status) {
        if (status != LttStatus.DRAFT && status != LttStatus.RETURNED_TO_MAKER) {
            throw new IllegalStateException(
                    "Cannot submit LTT in status: " + status.getCode()
                            + ". Only DRAFT or RETURNED_TO_MAKER are allowed.");
        }
    }

    /**
     * // VAL-14: Validate Maker ownership (BIZ-002).
     * Only the original Maker can edit, delete, or submit the LTT.
     */
    private void validateMakerOwnership(LttHeader header, String currentUserId) {
        if (!Objects.equals(header.getCreatedBy(), currentUserId)) {
            throw new IllegalStateException(
                    "Only the original Maker can perform this operation. Maker: "
                            + header.getCreatedBy() + ", Current user: " + currentUserId);
        }
    }

    /**
     * // VAL-15: Optimistic lock validation.
     * The fVer from the request must match the current DB value.
     */
    private void validateOptimisticLock(LttHeader header, Integer requestFVer) {
        if (requestFVer == null || !requestFVer.equals(header.getFVer())) {
            throw new IllegalStateException(
                    "Optimistic lock conflict: record has been modified by another session. "
                            + "Please reload and try again. DB fVer: " + header.getFVer()
                            + ", Request fVer: " + requestFVer);
        }
    }

    /**
     * // BIZ-001: SoD enforcement for Checker.
     * Checker must not be the same user as Maker.
     */
    private void validateSoDChecker(LttHeader header, String checkerUserId) {
        if (Objects.equals(header.getCreatedBy(), checkerUserId)) {
            throw new IllegalStateException(
                    "BIZ-001 SoD violation: Checker cannot be the same as Maker. "
                            + "Maker: " + header.getCreatedBy() + ", Checker: " + checkerUserId);
        }
    }

    /**
     * // BIZ-001: SoD enforcement for Approver.
     * Approver must not be the same user as Maker or Checker.
     */
    private void validateSoDApprover(LttHeader header, String approverUserId) {
        if (Objects.equals(header.getCreatedBy(), approverUserId)) {
            throw new IllegalStateException(
                    "BIZ-001 SoD violation: Approver cannot be the same as Maker. "
                            + "Maker: " + header.getCreatedBy() + ", Approver: " + approverUserId);
        }
        if (header.getCheckedBy() != null
                && Objects.equals(header.getCheckedBy(), approverUserId)) {
            throw new IllegalStateException(
                    "BIZ-001 SoD violation: Approver cannot be the same as Checker. "
                            + "Checker: " + header.getCheckedBy() + ", Approver: " + approverUserId);
        }
    }

    /**
     * // BIZ-006: Note validation for RETURN/REJECT actions.
     * Note is required and must be >= 10 characters when returning or rejecting.
     */
    private void validateApprovalNote(LttApprovalRequest request) {
        if (request.getAction() == LttApprovalRequest.ApprovalAction.RETURN
                || request.getAction() == LttApprovalRequest.ApprovalAction.REJECT) {
            if (request.getNote() == null || request.getNote().length() < 10) {
                throw new IllegalArgumentException(
                        "BIZ-006: Note is required and must be at least 10 characters for "
                                + request.getAction() + " action");
            }
            if (request.getNote().length() > 500) {
                throw new IllegalArgumentException(
                        "BIZ-006: Note must not exceed 500 characters");
            }
        }
    }

    /**
     * // BIZ-004: Validate detail line amounts.
     * If details are provided, their sum must equal the header amount.
     */
    private void validateDetailAmounts(List<LttCreateRequest.LttDetailLine> details,
                                       BigDecimal headerAmount) {
        if (details == null || details.isEmpty() || headerAmount == null) {
            return;
        }

        BigDecimal detailSum = details.stream()
                .map(LttCreateRequest.LttDetailLine::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (detailSum.compareTo(headerAmount) != 0) {
            throw new IllegalArgumentException(
                    "BIZ-004: Detail amount sum (" + detailSum
                            + ") does not equal header amount (" + headerAmount + ")");
        }
    }

    /**
     * // BIZ-004: Validate persisted detail amount sum against header amount.
     * Called during submit to enforce full validation.
     */
    private void validateDetailAmountSum(List<LttDetail> details, BigDecimal headerAmount) {
        if (details == null || details.isEmpty()) {
            throw new IllegalArgumentException(
                    "BIZ-004: LTT must have at least one detail line before submit");
        }
        if (headerAmount == null) {
            throw new IllegalArgumentException("Header amount must not be null");
        }

        BigDecimal detailSum = details.stream()
                .map(LttDetail::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (detailSum.compareTo(headerAmount) != 0) {
            throw new IllegalArgumentException(
                    "BIZ-004: Detail amount sum (" + detailSum
                            + ") does not equal header amount (" + headerAmount + ")");
        }
    }

    // ========================================================================
    // Private helper methods for entity building
    // ========================================================================

    private List<LttDetail> buildDetailEntities(Long lttId,
                                                 List<LttCreateRequest.LttDetailLine> lines) {
        List<LttDetail> details = new ArrayList<>();
        for (int i = 0; i < lines.size(); i++) {
            LttCreateRequest.LttDetailLine line = lines.get(i);
            details.add(LttDetail.builder()
                    .lttId(lttId)
                    .lineNo(i + 1)
                    .glSegment1(line.getGlSegment1())
                    .glSegment2(line.getGlSegment2())
                    .glSegment3(line.getGlSegment3())
                    .glSegment4(line.getGlSegment4())
                    .glSegment5(line.getGlSegment5())
                    .glSegment6(line.getGlSegment6())
                    .glSegment7(line.getGlSegment7())
                    .glSegment8(line.getGlSegment8())
                    .glSegment9(line.getGlSegment9())
                    .glSegment10(line.getGlSegment10())
                    .glSegment11(line.getGlSegment11())
                    .glSegment12(line.getGlSegment12())
                    .description(line.getDescription())
                    .amount(line.getAmount())
                    .build());
        }
        return details;
    }

    private List<LttDetail> buildDetailEntitiesFromUpdate(Long lttId,
                                                           List<LttCreateRequest.LttDetailLine> lines) {
        return buildDetailEntities(lttId, lines);
    }

    private LttSender buildSenderEntity(Long lttId, LttCreateRequest.LttSenderInfo info) {
        return LttSender.builder()
                .lttId(lttId)
                .senderName(info.getSenderName())
                .senderAddress(info.getSenderAddress())
                .senderGlSegment2(info.getSenderGlSegment2())
                .senderNum(info.getSenderNum())
                .senderBankCode(info.getSenderBankCode())
                .senderIdentifyId(info.getSenderIdentifyId())
                .senderIssuedDate(info.getSenderIssuedDate())
                .senderIssuedPlace(info.getSenderIssuedPlace())
                .tpcpCode(info.getTpcpCode())
                .build();
    }

    private LttReceiver buildReceiverEntity(Long lttId, LttCreateRequest.LttReceiverInfo info) {
        return LttReceiver.builder()
                .lttId(lttId)
                .receiverName(info.getReceiverName())
                .receiverAddress(info.getReceiverAddress())
                .receiverGlSegment2(info.getReceiverGlSegment2())
                .receiverBankName(info.getReceiverBankName())
                .receiverBankCode(info.getReceiverBankCode())
                .receiverIdentifyId(info.getReceiverIdentifyId())
                .receiverIssuedDate(info.getReceiverIssuedDate())
                .receiverIssuedPlace(info.getReceiverIssuedPlace())
                .build();
    }

    private void updateHeaderFields(LttHeader header, LttUpdateRequest request, String userId) {
        if (request.getChannel() != null) header.setChannel(request.getChannel());
        if (request.getTransactionType() != null) header.setTransactionType(request.getTransactionType());
        if (request.getLnhTransactionType() != null) header.setLnhTransactionType(request.getLnhTransactionType());
        if (request.getSenderCode() != null) header.setSenderCode(request.getSenderCode());
        if (request.getReceiverCode() != null) header.setReceiverCode(request.getReceiverCode());
        if (request.getRefNo() != null) header.setRefNo(request.getRefNo());
        if (request.getPaymentDate() != null) header.setPaymentDate(request.getPaymentDate());
        if (request.getAmount() != null) header.setAmount(request.getAmount());
        if (request.getCurrencyCode() != null) header.setCurrencyCode(request.getCurrencyCode());
        if (request.getExchangeRate() != null) header.setExchangeRate(request.getExchangeRate());
        if (request.getOriginNum() != null) header.setOriginNum(request.getOriginNum());
        if (request.getTransactionDate() != null) header.setTransactionDate(request.getTransactionDate());
        if (request.getExpType() != null) header.setExpType(request.getExpType());
        if (request.getFnCode1() != null) header.setFnCode1(request.getFnCode1());
        if (request.getFnCode2() != null) header.setFnCode2(request.getFnCode2());
        if (request.getFnAmount() != null) header.setFnAmount(request.getFnAmount());
        if (request.getDescription() != null) header.setDescription(request.getDescription());
        if (request.getIdempotencyKey() != null) header.setIdempotencyKey(request.getIdempotencyKey());
        header.setUpdatedBy(userId);
        header.setUpdatedDate(LocalDateTime.now());
    }

    private void updateSenderFields(LttSender sender, LttCreateRequest.LttSenderInfo info) {
        if (info.getSenderName() != null) sender.setSenderName(info.getSenderName());
        if (info.getSenderAddress() != null) sender.setSenderAddress(info.getSenderAddress());
        if (info.getSenderGlSegment2() != null) sender.setSenderGlSegment2(info.getSenderGlSegment2());
        if (info.getSenderNum() != null) sender.setSenderNum(info.getSenderNum());
        if (info.getSenderBankCode() != null) sender.setSenderBankCode(info.getSenderBankCode());
        if (info.getSenderIdentifyId() != null) sender.setSenderIdentifyId(info.getSenderIdentifyId());
        if (info.getSenderIssuedDate() != null) sender.setSenderIssuedDate(info.getSenderIssuedDate());
        if (info.getSenderIssuedPlace() != null) sender.setSenderIssuedPlace(info.getSenderIssuedPlace());
        if (info.getTpcpCode() != null) sender.setTpcpCode(info.getTpcpCode());
    }

    private void updateReceiverFields(LttReceiver receiver, LttCreateRequest.LttReceiverInfo info) {
        if (info.getReceiverName() != null) receiver.setReceiverName(info.getReceiverName());
        if (info.getReceiverAddress() != null) receiver.setReceiverAddress(info.getReceiverAddress());
        if (info.getReceiverGlSegment2() != null) receiver.setReceiverGlSegment2(info.getReceiverGlSegment2());
        if (info.getReceiverBankName() != null) receiver.setReceiverBankName(info.getReceiverBankName());
        if (info.getReceiverBankCode() != null) receiver.setReceiverBankCode(info.getReceiverBankCode());
        if (info.getReceiverIdentifyId() != null) receiver.setReceiverIdentifyId(info.getReceiverIdentifyId());
        if (info.getReceiverIssuedDate() != null) receiver.setReceiverIssuedDate(info.getReceiverIssuedDate());
        if (info.getReceiverIssuedPlace() != null) receiver.setReceiverIssuedPlace(info.getReceiverIssuedPlace());
    }
}
