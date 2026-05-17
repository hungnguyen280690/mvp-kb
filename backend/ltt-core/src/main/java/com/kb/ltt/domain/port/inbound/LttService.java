package com.kb.ltt.domain.port.inbound;

import com.kb.ltt.domain.model.LttApprovalRequest;
import com.kb.ltt.domain.model.LttCreateRequest;
import com.kb.ltt.domain.model.LttDeleteRequest;
import com.kb.ltt.domain.model.LttDetailResponse;
import com.kb.ltt.domain.model.LttFilterRequest;
import com.kb.ltt.domain.model.LttHeader;
import com.kb.ltt.domain.model.LttUpdateRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Inbound port (Use Case interface) for LTT operations.
 * This is the primary API that the infrastructure layer (controllers) depends on.
 *
 * Follows Hexagonal Architecture: domain defines the port, infrastructure provides adapters.
 *
 * // FT-001: LTT use case interface
 */
public interface LttService {

    /**
     * List LTTs with filtering and pagination.
     * Maps to GET /api/v1/ltt (LTT.LIST.VIEW)
     *
     * @param filter   search criteria from MOD.LIST filters
     * @param pageable pagination and sorting parameters
     * @return paginated list of LTT headers
     */
    Page<LttHeader> listLtt(LttFilterRequest filter, Pageable pageable);

    /**
     * Get full detail of an LTT including header, details, sender, receiver.
     * Maps to GET /api/v1/ltt/{id} (LTT.VIEW.OPEN)
     *
     * @param id the LTT primary key (F_ID)
     * @return composite detail response
     */
    LttDetailResponse getLttDetail(Long id);

    /**
     * Create a new LTT in DRAFT status.
     * Maps to POST /api/v1/ltt (LTT.NEW.SAVE)
     *
     * // BIZ-002: New record always starts as DRAFT
     * // Rule 2.3: Idempotency key validation
     *
     * @param request create payload with header, details, sender, receiver
     * @param userId  the user creating the LTT (auto-filled as createdBy)
     * @return the created LTT header
     */
    LttHeader createLtt(LttCreateRequest request, String userId);

    /**
     * Update an existing LTT (only in DRAFT or RETURNED_TO_MAKER status).
     * Maps to PUT /api/v1/ltt/{id} (LTT.EDIT.SAVE)
     *
     * // BIZ-002: Only original Maker can edit
     * // VAL-13: Only DRAFT/RETURNED_TO_MAKER allowed
     * // VAL-15: Optimistic lock check via fVer
     *
     * @param id      the LTT primary key
     * @param request update payload with fVer for optimistic lock
     * @param userId  the user performing the update
     * @return the updated LTT header
     */
    LttHeader updateLtt(Long id, LttUpdateRequest request, String userId);

    /**
     * Soft-delete an LTT (only in DRAFT or RETURNED_TO_MAKER status).
     * Maps to DELETE /api/v1/ltt/{id} (LTT.DELETE.CONFIRM)
     *
     * // BIZ-003: Soft-delete, F_STATUS = DELETED
     * // VAL-13: Only DRAFT/RETURNED_TO_MAKER allowed
     * // VAL-14: Only original Maker can delete
     * // VAL-16: Delete reason >= 10 chars
     *
     * @param id      the LTT primary key
     * @param request contains deleteReason and fVer
     * @param userId  the user performing the delete
     */
    void deleteLtt(Long id, LttDeleteRequest request, String userId);

    /**
     * Submit an LTT for Checker review.
     * Maps to POST /api/v1/ltt/{id}/submit (LTT.NEW.SUBMIT)
     *
     * Transition: DRAFT/RETURNED_TO_MAKER -> READY_FOR_APPROVAL
     *
     * // BIZ-002: Only original Maker can submit
     * // VAL-13: Only DRAFT/RETURNED_TO_MAKER allowed
     * // BIZ-004: Detail amount sum must equal header amount
     *
     * @param id     the LTT primary key
     * @param userId the user performing the submit (must be Maker)
     */
    void submitLtt(Long id, String userId);

    /**
     * Checker reviews an LTT (approve, return, or reject).
     * Maps to POST /api/v1/ltt/{id}/check (LTT.APPROVE.CHECKER)
     *
     * Transitions:
     *   APPROVE  -> READY_FOR_APPROVAL -> PENDING_APPROVER
     *   RETURN   -> READY_FOR_APPROVAL -> RETURNED_TO_MAKER
     *   REJECT   -> READY_FOR_APPROVAL -> REJECTED
     *
     * // BIZ-001: SoD enforcement - checker != maker
     * // BIZ-006: Note required when return/reject, >= 10 chars
     *
     * @param id      the LTT primary key
     * @param request contains action (APPROVE/RETURN/REJECT) and note
     * @param userId  the user performing the check (must be Checker role)
     */
    void checkLtt(Long id, LttApprovalRequest request, String userId);

    /**
     * Approver reviews an LTT (approve, return, or reject).
     * Maps to POST /api/v1/ltt/{id}/approve (LTT.APPROVE.APPROVER)
     *
     * Transitions:
     *   APPROVE  -> PENDING_APPROVER -> APPROVED
     *   RETURN   -> PENDING_APPROVER -> RETURNED_TO_MAKER
     *   REJECT   -> PENDING_APPROVER -> REJECTED
     *
     * // BIZ-001: SoD enforcement - approver != maker && approver != checker
     * // BIZ-006: Note required when return/reject, >= 10 chars
     * // BIZ-010: Limit check for high-value transactions
     *
     * @param id      the LTT primary key
     * @param request contains action (APPROVE/RETURN/REJECT) and note
     * @param userId  the user performing the approval (must be Approver role)
     */
    void approveLtt(Long id, LttApprovalRequest request, String userId);

    /**
     * Copy an existing LTT to a new DRAFT record.
     * Maps to POST /api/v1/ltt/{id}/copy (LTT.NEW.COPY)
     *
     * Creates a new LTT with same data but new F_ID, F_STATUS=DRAFT, F_VER=1.
     *
     * @param id     the source LTT primary key
     * @param userId the user performing the copy (becomes createdBy of new record)
     * @return the new copied LTT header
     */
    LttHeader copyLtt(Long id, String userId);
}
