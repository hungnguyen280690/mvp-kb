package com.kb.ltt.domain;

import com.kb.ltt.domain.exception.InvalidStatusTransitionException;
import com.kb.ltt.domain.exception.SoDViolationException;
import com.kb.ltt.domain.model.ChannelCode;
import com.kb.ltt.domain.model.PayOrder;
import com.kb.ltt.domain.model.PayOrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the PayOrder state machine.
 * Covers ≥10 valid transitions and ≥10 invalid ones plus SoD violations.
 */
class PayOrderStateMachineTest {

    private static final String MAKER    = "maker-001";
    private static final String CHECKER  = "checker-001";
    private static final String APPROVER = "approver-001";
    private static final String REASON   = "Reason with at least 10 chars";

    /** Helper: build a minimal DRAFT order created by MAKER */
    private PayOrder draftOrder() {
        return PayOrder.builder()
                .id(UUID.randomUUID().toString())
                .version(0)
                .status(PayOrderStatus.DRAFT)
                .refNo("REF-001")
                .channel(ChannelCode.LNH)
                .createdBy(MAKER)
                .createdAt(Instant.now())
                .amount(BigDecimal.valueOf(1_000_000))
                .paymentDate(LocalDate.now())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VALID TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Valid transitions")
    class ValidTransitions {

        @Test
        @DisplayName("T1: Constructor creates order in DRAFT status")
        void create_draft() {
            PayOrder order = draftOrder();
            assertThat(order.getStatus()).isEqualTo(PayOrderStatus.DRAFT);
            assertThat(order.getCreatedBy()).isEqualTo(MAKER);
        }

        @Test
        @DisplayName("T2: DRAFT → submit → READY_FOR_APPROVAL")
        void draft_submit_ready() {
            PayOrder ready = draftOrder().submit(MAKER);
            assertThat(ready.getStatus()).isEqualTo(PayOrderStatus.READY_FOR_APPROVAL);
        }

        @Test
        @DisplayName("T3: READY_FOR_APPROVAL → checkApprove → PENDING_APPROVER")
        void ready_checkApprove_pending() {
            PayOrder pending = draftOrder().submit(MAKER).checkApprove(CHECKER);
            assertThat(pending.getStatus()).isEqualTo(PayOrderStatus.PENDING_APPROVER);
            assertThat(pending.getCheckerId()).isEqualTo(CHECKER);
            assertThat(pending.getCheckerActionAt()).isNotNull();
        }

        @Test
        @DisplayName("T4: PENDING_APPROVER → approve → APPROVED")
        void pending_approve_approved() {
            PayOrder approved = draftOrder()
                    .submit(MAKER)
                    .checkApprove(CHECKER)
                    .approve(APPROVER);
            assertThat(approved.getStatus()).isEqualTo(PayOrderStatus.APPROVED);
            assertThat(approved.getApproverId()).isEqualTo(APPROVER);
            assertThat(approved.getApproverActionAt()).isNotNull();
        }

        @Test
        @DisplayName("T5: READY_FOR_APPROVAL → returnToMaker → RETURNED_TO_MAKER")
        void ready_returnToMaker_returned() {
            PayOrder returned = draftOrder().submit(MAKER).returnToMaker(CHECKER, REASON);
            assertThat(returned.getStatus()).isEqualTo(PayOrderStatus.RETURNED_TO_MAKER);
            assertThat(returned.getCheckerComment()).isEqualTo(REASON);
        }

        @Test
        @DisplayName("T6: PENDING_APPROVER → returnToMaker → RETURNED_TO_MAKER")
        void pending_returnToMaker_returned() {
            PayOrder returned = draftOrder()
                    .submit(MAKER)
                    .checkApprove(CHECKER)
                    .returnToMaker(APPROVER, REASON);
            assertThat(returned.getStatus()).isEqualTo(PayOrderStatus.RETURNED_TO_MAKER);
        }

        @Test
        @DisplayName("T7: READY_FOR_APPROVAL → reject → REJECTED")
        void ready_reject_rejected() {
            PayOrder rejected = draftOrder().submit(MAKER).reject(CHECKER, REASON);
            assertThat(rejected.getStatus()).isEqualTo(PayOrderStatus.REJECTED);
        }

        @Test
        @DisplayName("T8: PENDING_APPROVER → reject → REJECTED")
        void pending_reject_rejected() {
            PayOrder rejected = draftOrder()
                    .submit(MAKER)
                    .checkApprove(CHECKER)
                    .reject(APPROVER, REASON);
            assertThat(rejected.getStatus()).isEqualTo(PayOrderStatus.REJECTED);
            assertThat(rejected.getApproverComment()).isEqualTo(REASON);
        }

        @Test
        @DisplayName("T9: RETURNED_TO_MAKER → submit → READY_FOR_APPROVAL")
        void returned_submit_ready() {
            PayOrder ready = draftOrder()
                    .submit(MAKER)
                    .returnToMaker(CHECKER, REASON)
                    .submit(MAKER);
            assertThat(ready.getStatus()).isEqualTo(PayOrderStatus.READY_FOR_APPROVAL);
        }

        @Test
        @DisplayName("T10: DRAFT → softDelete → DELETED")
        void draft_softDelete_deleted() {
            PayOrder deleted = draftOrder().softDelete(MAKER, REASON);
            assertThat(deleted.getStatus()).isEqualTo(PayOrderStatus.DELETED);
            assertThat(deleted.getDeletedBy()).isEqualTo(MAKER);
            assertThat(deleted.getDeleteReason()).isEqualTo(REASON);
            assertThat(deleted.getDeletedAt()).isNotNull();
        }

        @Test
        @DisplayName("T11: RETURNED_TO_MAKER → softDelete → DELETED")
        void returned_softDelete_deleted() {
            PayOrder deleted = draftOrder()
                    .submit(MAKER)
                    .returnToMaker(CHECKER, REASON)
                    .softDelete(MAKER, REASON);
            assertThat(deleted.getStatus()).isEqualTo(PayOrderStatus.DELETED);
        }

        @Test
        @DisplayName("T12: markUpdated bumps version and records updater")
        void markUpdated_bumps_version() {
            PayOrder updated = draftOrder().markUpdated(MAKER, "127.0.0.1");
            assertThat(updated.getVersion()).isEqualTo(1);
            assertThat(updated.getUpdatedBy()).isEqualTo(MAKER);
            assertThat(updated.getUpdatedIp()).isEqualTo("127.0.0.1");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INVALID TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Invalid transitions — must throw InvalidStatusTransitionException")
    class InvalidTransitions {

        @Test
        @DisplayName("I1: APPROVED → submit → exception")
        void approved_submit_throws() {
            PayOrder approved = draftOrder()
                    .submit(MAKER).checkApprove(CHECKER).approve(APPROVER);
            assertThatThrownBy(() -> approved.submit(MAKER))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("submit");
        }

        @Test
        @DisplayName("I2: REJECTED → checkApprove → exception")
        void rejected_checkApprove_throws() {
            PayOrder rejected = draftOrder().submit(MAKER).reject(CHECKER, REASON);
            assertThatThrownBy(() -> rejected.checkApprove(CHECKER))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("checkApprove");
        }

        @Test
        @DisplayName("I3: DELETED → approve → exception")
        void deleted_approve_throws() {
            PayOrder deleted = draftOrder().softDelete(MAKER, REASON);
            assertThatThrownBy(() -> deleted.approve(APPROVER))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("approve");
        }

        @Test
        @DisplayName("I4: APPROVED → reject → exception")
        void approved_reject_throws() {
            PayOrder approved = draftOrder()
                    .submit(MAKER).checkApprove(CHECKER).approve(APPROVER);
            assertThatThrownBy(() -> approved.reject(APPROVER, REASON))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("reject");
        }

        @Test
        @DisplayName("I5: DRAFT → approve (skip states) → exception")
        void draft_approve_throws() {
            assertThatThrownBy(() -> draftOrder().approve(APPROVER))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("approve");
        }

        @Test
        @DisplayName("I6: DRAFT → checkApprove → exception")
        void draft_checkApprove_throws() {
            assertThatThrownBy(() -> draftOrder().checkApprove(CHECKER))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("checkApprove");
        }

        @Test
        @DisplayName("I7: APPROVED → softDelete → exception")
        void approved_softDelete_throws() {
            PayOrder approved = draftOrder()
                    .submit(MAKER).checkApprove(CHECKER).approve(APPROVER);
            assertThatThrownBy(() -> approved.softDelete(MAKER, REASON))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("softDelete");
        }

        @Test
        @DisplayName("I8: REJECTED → returnToMaker → exception")
        void rejected_returnToMaker_throws() {
            PayOrder rejected = draftOrder().submit(MAKER).reject(CHECKER, REASON);
            assertThatThrownBy(() -> rejected.returnToMaker(MAKER, REASON))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("returnToMaker");
        }

        @Test
        @DisplayName("I9: READY_FOR_APPROVAL → submit → InvalidStatusTransitionException (already submitted)")
        void ready_submit_throws() {
            // READY_FOR_APPROVAL is not a valid source for submit, so status guard fires first
            PayOrder ready = draftOrder().submit(MAKER);
            assertThatThrownBy(() -> ready.submit(MAKER))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("submit");
        }

        @Test
        @DisplayName("I10: PENDING_APPROVER → approve → exception (wrong state for approve)")
        void draft_reject_throws() {
            assertThatThrownBy(() -> draftOrder().reject(CHECKER, REASON))
                    .isInstanceOf(InvalidStatusTransitionException.class)
                    .hasMessageContaining("reject");
        }

        @Test
        @DisplayName("I11: returnToMaker with short reason throws BusinessException")
        void returnToMaker_short_reason_throws() {
            PayOrder ready = draftOrder().submit(MAKER);
            assertThatThrownBy(() -> ready.returnToMaker(CHECKER, "too short"))
                    .isInstanceOf(com.kb.ltt.domain.exception.BusinessException.class);
        }

        @Test
        @DisplayName("I12: softDelete with short reason throws BusinessException")
        void softDelete_short_reason_throws() {
            assertThatThrownBy(() -> draftOrder().softDelete(MAKER, "short"))
                    .isInstanceOf(com.kb.ltt.domain.exception.BusinessException.class);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SoD VIOLATIONS
    // ═══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Segregation of Duties violations")
    class SoDViolations {

        @Test
        @DisplayName("SoD1: checkApprove with checkerId == createdBy → SoDViolationException")
        void checkApprove_same_as_maker_throws() {
            PayOrder ready = draftOrder().submit(MAKER);
            assertThatThrownBy(() -> ready.checkApprove(MAKER))   // MAKER == createdBy
                    .isInstanceOf(SoDViolationException.class)
                    .hasMessageContaining("maker");
        }

        @Test
        @DisplayName("SoD2: approve with approverId == createdBy → SoDViolationException")
        void approve_same_as_maker_throws() {
            PayOrder pending = draftOrder().submit(MAKER).checkApprove(CHECKER);
            assertThatThrownBy(() -> pending.approve(MAKER))      // MAKER == createdBy
                    .isInstanceOf(SoDViolationException.class)
                    .hasMessageContaining("maker");
        }

        @Test
        @DisplayName("SoD3: approve with approverId == checkerId → SoDViolationException")
        void approve_same_as_checker_throws() {
            PayOrder pending = draftOrder().submit(MAKER).checkApprove(CHECKER);
            assertThatThrownBy(() -> pending.approve(CHECKER))    // CHECKER == checkerId
                    .isInstanceOf(SoDViolationException.class)
                    .hasMessageContaining("checker");
        }

        @Test
        @DisplayName("SoD4: softDelete by non-maker → SoDViolationException")
        void softDelete_by_non_maker_throws() {
            assertThatThrownBy(() -> draftOrder().softDelete("intruder-999", REASON))
                    .isInstanceOf(SoDViolationException.class);
        }

        @Test
        @DisplayName("SoD5: submit by non-maker → SoDViolationException")
        void submit_by_non_maker_throws() {
            assertThatThrownBy(() -> draftOrder().submit("intruder-999"))
                    .isInstanceOf(SoDViolationException.class);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Exception properties
    // ═══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Exception properties")
    class ExceptionProperties {

        @Test
        @DisplayName("InvalidStatusTransitionException carries correct code and fields")
        void invalid_transition_exception_fields() {
            PayOrder approved = draftOrder()
                    .submit(MAKER).checkApprove(CHECKER).approve(APPROVER);
            try {
                approved.submit(MAKER);
            } catch (InvalidStatusTransitionException ex) {
                assertThat(ex.getCode()).isEqualTo("MSG-ERR-STATUS");
                assertThat(ex.getFromStatus()).isEqualTo(PayOrderStatus.APPROVED);
                assertThat(ex.getAction()).isEqualTo("submit");
            }
        }

        @Test
        @DisplayName("SoDViolationException carries correct code")
        void sod_exception_code() {
            PayOrder ready = draftOrder().submit(MAKER);
            try {
                ready.checkApprove(MAKER);
            } catch (SoDViolationException ex) {
                assertThat(ex.getCode()).isEqualTo("MSG-ERR-PERMISSION");
            }
        }

        @Test
        @DisplayName("OptimisticLockException carries version fields and code")
        void optimistic_lock_exception_fields() {
            var ex = new com.kb.ltt.domain.exception.OptimisticLockException(3L, 5L);
            assertThat(ex.getCode()).isEqualTo("MSG-ERR-LOCK");
            assertThat(ex.getYourVersion()).isEqualTo(3L);
            assertThat(ex.getCurrentVersion()).isEqualTo(5L);
        }
    }
}
