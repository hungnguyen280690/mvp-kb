package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.ApprovalStatusResponse;
import com.kb.ltt.application.dto.ApprovalStatusResponse.ApprovalStep;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Returns the 3-step MAKER → CHECKER → APPROVER workflow status for a PayOrder.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ApprovalStatusUseCase {

    private final PayOrderRepository payOrderRepository;

    /**
     * Builds the approval status response for the given order.
     *
     * @param orderId UUID of the PayOrder
     * @return 3-step approval status
     */
    public ApprovalStatusResponse getApprovalStatus(String orderId) {
        PayOrderEntity entity = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("MSG-ERR-NOT-FOUND",
                        "PayOrder không tồn tại: " + orderId));

        String status = entity.getStatus();

        // ── Step 1: MAKER ─────────────────────────────────────────────────
        String makerAction = determineMakerAction(status);
        ApprovalStep makerStep = new ApprovalStep(
                "MAKER",
                entity.getCreatedBy(),
                null,                          // userName resolved at controller/UI layer
                entity.getCreatedAt(),
                makerAction,
                null,
                true                           // MAKER step is always completed once the order exists
        );

        // ── Step 2: CHECKER ───────────────────────────────────────────────
        boolean checkerCompleted = entity.getCheckerId() != null;
        String checkerAction = determineCheckerAction(status);
        ApprovalStep checkerStep = new ApprovalStep(
                "CHECKER",
                entity.getCheckerId(),
                null,
                entity.getCheckerActionAt(),
                checkerAction,
                entity.getCheckerComment(),
                checkerCompleted
        );

        // ── Step 3: APPROVER ──────────────────────────────────────────────
        boolean approverCompleted = entity.getApproverId() != null;
        String approverAction = determineApproverAction(status);
        ApprovalStep approverStep = new ApprovalStep(
                "APPROVER",
                entity.getApproverId(),
                null,
                entity.getApproverActionAt(),
                approverAction,
                entity.getApproverComment(),
                approverCompleted
        );

        // ── Current step ──────────────────────────────────────────────────
        String currentStep = determineCurrentStep(status);

        return new ApprovalStatusResponse(
                orderId,
                status,
                List.of(makerStep, checkerStep, approverStep),
                currentStep
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String determineMakerAction(String status) {
        return switch (status) {
            case "DRAFT"             -> "SAVED";
            case "PENDING_CHECK",
                 "PENDING_APPROVE",
                 "APPROVED",
                 "REJECTED",
                 "RETURNED_TO_MAKER" -> "SUBMITTED";
            default                  -> "SUBMITTED";
        };
    }

    private String determineCheckerAction(String status) {
        return switch (status) {
            case "PENDING_CHECK"     -> null;       // not yet acted
            case "PENDING_APPROVE"   -> "CHECK_APPROVED";
            case "APPROVED"          -> "CHECK_APPROVED";
            case "RETURNED_TO_MAKER" -> "RETURNED";
            case "REJECTED"          -> "CHECK_APPROVED";  // checker passed; approver rejected
            default                  -> null;
        };
    }

    private String determineApproverAction(String status) {
        return switch (status) {
            case "APPROVED"  -> "APPROVED";
            case "REJECTED"  -> "REJECTED";
            default          -> null;
        };
    }

    private String determineCurrentStep(String status) {
        return switch (status) {
            case "DRAFT", "RETURNED_TO_MAKER" -> "MAKER";
            case "PENDING_CHECK"              -> "CHECKER";
            case "PENDING_APPROVE"            -> "APPROVER";
            case "APPROVED", "REJECTED"       -> "COMPLETED";
            default                           -> "MAKER";
        };
    }
}
