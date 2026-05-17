package com.kb.ltt.infrastructure.web;

import com.kb.ltt.domain.model.LttApprovalRequest;
import com.kb.ltt.domain.model.LttCreateRequest;
import com.kb.ltt.domain.model.LttDeleteRequest;
import com.kb.ltt.domain.model.LttDetailResponse;
import com.kb.ltt.domain.model.LttFilterRequest;
import com.kb.ltt.domain.model.LttHeader;
import com.kb.ltt.domain.model.LttUpdateRequest;
import com.kb.ltt.domain.port.inbound.LttService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for LTT operations.
 * Exposes /api/v1/ltt endpoints as defined in the SA design doc.
 *
 * Note: This controller is currently exposed directly. In production,
 * it will be internal and called by bff-service via service-to-service.
 *
 * // FT-001: LTT REST controller
 * // Rule 2.3: Idempotency via X-Request-ID header
 */
@RestController
@RequestMapping("/api/v1/ltt")
@RequiredArgsConstructor
@Slf4j
public class LttController {

    private final LttService lttService;

    /**
     * GET /api/v1/ltt - List LTTs with filtering and pagination.
     * Event: LTT.LIST.VIEW
     */
    @GetMapping
    public ResponseEntity<Page<LttHeader>> listLtt(
            LttFilterRequest filter,
            Pageable pageable) {
        log.info("LTT.LIST.VIEW - Listing LTTs");
        Page<LttHeader> result = lttService.listLtt(filter, pageable);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/ltt/{id} - Get LTT detail.
     * Event: LTT.VIEW.OPEN
     */
    @GetMapping("/{id}")
    public ResponseEntity<LttDetailResponse> getLttDetail(@PathVariable Long id) {
        log.info("LTT.VIEW.OPEN - Fetching LTT id: {}", id);
        LttDetailResponse response = lttService.getLttDetail(id);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/ltt - Create new LTT.
     * Event: LTT.NEW.SAVE
     * // Rule 2.3: X-Request-ID for idempotency
     */
    @PostMapping
    public ResponseEntity<LttHeader> createLtt(
            @RequestBody LttCreateRequest request,
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader(value = "X-Request-ID", required = false) String requestId) {
        log.info("LTT.NEW.SAVE - Creating LTT by user: {}", userId);

        // Set idempotency key from header if provided
        if (requestId != null && !requestId.isBlank()
                && request.getIdempotencyKey() == null) {
            request.setIdempotencyKey(requestId);
        }

        LttHeader created = lttService.createLtt(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/ltt/{id} - Update LTT.
     * Event: LTT.EDIT.SAVE
     */
    @PutMapping("/{id}")
    public ResponseEntity<LttHeader> updateLtt(
            @PathVariable Long id,
            @RequestBody LttUpdateRequest request,
            @RequestHeader("X-User-ID") String userId) {
        log.info("LTT.EDIT.SAVE - Updating LTT id: {} by user: {}", id, userId);
        LttHeader updated = lttService.updateLtt(id, request, userId);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/v1/ltt/{id} - Soft-delete LTT.
     * Event: LTT.DELETE.CONFIRM
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLtt(
            @PathVariable Long id,
            @RequestBody LttDeleteRequest request,
            @RequestHeader("X-User-ID") String userId) {
        log.info("LTT.DELETE.CONFIRM - Deleting LTT id: {} by user: {}", id, userId);
        lttService.deleteLtt(id, request, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v1/ltt/{id}/submit - Submit LTT for Checker review.
     * Event: LTT.NEW.SUBMIT
     * Transition: DRAFT/RETURNED_TO_MAKER -> READY_FOR_APPROVAL
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<Void> submitLtt(
            @PathVariable Long id,
            @RequestHeader("X-User-ID") String userId) {
        log.info("LTT.NEW.SUBMIT - Submitting LTT id: {} by user: {}", id, userId);
        lttService.submitLtt(id, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/v1/ltt/{id}/check - Checker review action.
     * Event: LTT.APPROVE.CHECKER
     * Transitions: READY_FOR_APPROVAL -> PENDING_APPROVER / RETURNED_TO_MAKER / REJECTED
     * // BIZ-001: SoD - Checker cannot be Maker
     */
    @PostMapping("/{id}/check")
    public ResponseEntity<Void> checkLtt(
            @PathVariable Long id,
            @RequestBody LttApprovalRequest request,
            @RequestHeader("X-User-ID") String userId) {
        log.info("LTT.APPROVE.CHECKER - Checking LTT id: {} by user: {}", id, userId);
        lttService.checkLtt(id, request, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/v1/ltt/{id}/approve - Approver review action.
     * Event: LTT.APPROVE.APPROVER
     * Transitions: PENDING_APPROVER -> APPROVED / RETURNED_TO_MAKER / REJECTED
     * // BIZ-001: SoD - Approver cannot be Maker or Checker
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approveLtt(
            @PathVariable Long id,
            @RequestBody LttApprovalRequest request,
            @RequestHeader("X-User-ID") String userId) {
        log.info("LTT.APPROVE.APPROVER - Approving LTT id: {} by user: {}", id, userId);
        lttService.approveLtt(id, request, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/v1/ltt/{id}/copy - Copy LTT to new DRAFT.
     * Event: LTT.NEW.COPY
     */
    @PostMapping("/{id}/copy")
    public ResponseEntity<LttHeader> copyLtt(
            @PathVariable Long id,
            @RequestHeader("X-User-ID") String userId) {
        log.info("LTT.NEW.COPY - Copying LTT id: {} by user: {}", id, userId);
        LttHeader copied = lttService.copyLtt(id, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(copied);
    }
}
