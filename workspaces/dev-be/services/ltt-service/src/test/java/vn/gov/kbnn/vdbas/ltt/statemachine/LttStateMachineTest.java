package vn.gov.kbnn.vdbas.ltt.statemachine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import vn.gov.kbnn.vdbas.ltt.domain.enums.LttState;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test cho LttStateMachine — test all transitions from states.yaml.
 */
class LttStateMachineTest {

    private LttStateMachine stateMachine;

    @BeforeEach
    void setUp() {
        stateMachine = new LttStateMachine();
    }

    // =========================================================================
    // DRAFT transitions
    // =========================================================================
    @Nested
    @DisplayName("DRAFT state transitions")
    class DraftTransitions {

        @Test
        @DisplayName("DRAFT + SUBMIT -> SUBMITTED")
        void draftSubmit() {
            TransitionResult result = stateMachine.transition(LttState.DRAFT, "SUBMIT");
            assertTrue(result.success());
            assertEquals("SUBMITTED", result.targetState());
        }

        @Test
        @DisplayName("DRAFT + EDIT -> DRAFT")
        void draftEdit() {
            TransitionResult result = stateMachine.transition(LttState.DRAFT, "EDIT");
            assertTrue(result.success());
            assertEquals("DRAFT", result.targetState());
        }

        @Test
        @DisplayName("DRAFT + DELETE -> (deleted)")
        void draftDelete() {
            TransitionResult result = stateMachine.transition(LttState.DRAFT, "DELETE");
            assertTrue(result.success());
            assertEquals("(deleted)", result.targetState());
        }

        @Test
        @DisplayName("DRAFT + APPROVE -> fail")
        void draftCannotApprove() {
            TransitionResult result = stateMachine.transition(LttState.DRAFT, "APPROVE");
            assertFalse(result.success());
        }
    }

    // =========================================================================
    // SUBMITTED transitions
    // =========================================================================
    @Nested
    @DisplayName("SUBMITTED state transitions")
    class SubmittedTransitions {

        @Test
        @DisplayName("SUBMITTED + APPROVE_CHECK -> IN_CONTROL")
        void submittedApproveCheck() {
            TransitionResult result = stateMachine.transition(LttState.SUBMITTED, "APPROVE_CHECK");
            assertTrue(result.success());
            assertEquals("IN_CONTROL", result.targetState());
        }

        @Test
        @DisplayName("SUBMITTED + REJECT -> RETURNED_TO_MAKER")
        void submittedReject() {
            TransitionResult result = stateMachine.transition(LttState.SUBMITTED, "REJECT");
            assertTrue(result.success());
            assertEquals("RETURNED_TO_MAKER", result.targetState());
        }
    }

    // =========================================================================
    // IN_CONTROL transitions
    // =========================================================================
    @Nested
    @DisplayName("IN_CONTROL state transitions")
    class InControlTransitions {

        @Test
        @DisplayName("IN_CONTROL + APPROVE -> APPROVED")
        void inControlApprove() {
            TransitionResult result = stateMachine.transition(LttState.IN_CONTROL, "APPROVE");
            assertTrue(result.success());
            assertEquals("APPROVED", result.targetState());
        }

        @Test
        @DisplayName("IN_CONTROL + REJECT -> RETURNED_TO_CHECKER")
        void inControlReject() {
            TransitionResult result = stateMachine.transition(LttState.IN_CONTROL, "REJECT");
            assertTrue(result.success());
            assertEquals("RETURNED_TO_CHECKER", result.targetState());
        }
    }

    // =========================================================================
    // RETURNED_TO_MAKER transitions
    // =========================================================================
    @Nested
    @DisplayName("RETURNED_TO_MAKER state transitions")
    class ReturnedToMakerTransitions {

        @Test
        @DisplayName("RETURNED_TO_MAKER + SUBMIT -> SUBMITTED")
        void returnedMakerSubmit() {
            TransitionResult result = stateMachine.transition(LttState.RETURNED_TO_MAKER, "SUBMIT");
            assertTrue(result.success());
            assertEquals("SUBMITTED", result.targetState());
        }

        @Test
        @DisplayName("RETURNED_TO_MAKER + EDIT -> DRAFT")
        void returnedMakerEdit() {
            TransitionResult result = stateMachine.transition(LttState.RETURNED_TO_MAKER, "EDIT");
            assertTrue(result.success());
            assertEquals("DRAFT", result.targetState());
        }

        @Test
        @DisplayName("RETURNED_TO_MAKER + DELETE -> (deleted)")
        void returnedMakerDelete() {
            TransitionResult result = stateMachine.transition(LttState.RETURNED_TO_MAKER, "DELETE");
            assertTrue(result.success());
            assertEquals("(deleted)", result.targetState());
        }
    }

    // =========================================================================
    // RETURNED_TO_CHECKER transitions
    // =========================================================================
    @Nested
    @DisplayName("RETURNED_TO_CHECKER state transitions")
    class ReturnedToCheckerTransitions {

        @Test
        @DisplayName("RETURNED_TO_CHECKER + SUBMIT -> IN_CONTROL")
        void returnedCheckerSubmit() {
            TransitionResult result = stateMachine.transition(LttState.RETURNED_TO_CHECKER, "SUBMIT");
            assertTrue(result.success());
            assertEquals("IN_CONTROL", result.targetState());
        }
    }

    // =========================================================================
    // APPROVED transitions
    // =========================================================================
    @Nested
    @DisplayName("APPROVED state transitions")
    class ApprovedTransitions {

        @Test
        @DisplayName("APPROVED + SIGN -> SIGNED")
        void approvedSign() {
            TransitionResult result = stateMachine.transition(LttState.APPROVED, "SIGN");
            assertTrue(result.success());
            assertEquals("SIGNED", result.targetState());
        }
    }

    // =========================================================================
    // SIGNED transitions
    // =========================================================================
    @Nested
    @DisplayName("SIGNED state transitions")
    class SignedTransitions {

        @Test
        @DisplayName("SIGNED + SEND -> SENT")
        void signedSend() {
            TransitionResult result = stateMachine.transition(LttState.SIGNED, "SEND");
            assertTrue(result.success());
            assertEquals("SENT", result.targetState());
        }

        @Test
        @DisplayName("SIGNED + CANCEL -> CANCELLED")
        void signedCancel() {
            TransitionResult result = stateMachine.transition(LttState.SIGNED, "CANCEL");
            assertTrue(result.success());
            assertEquals("CANCELLED", result.targetState());
        }
    }

    // =========================================================================
    // SENT transitions
    // =========================================================================
    @Nested
    @DisplayName("SENT state transitions")
    class SentTransitions {

        @Test
        @DisplayName("SENT + CALLBACK_SUCCESS -> CONFIRMED")
        void sentCallbackSuccess() {
            TransitionResult result = stateMachine.transition(LttState.SENT, "CALLBACK_SUCCESS");
            assertTrue(result.success());
            assertEquals("CONFIRMED", result.targetState());
        }

        @Test
        @DisplayName("SENT + CALLBACK_FAIL -> SEND_FAILED")
        void sentCallbackFail() {
            TransitionResult result = stateMachine.transition(LttState.SENT, "CALLBACK_FAIL");
            assertTrue(result.success());
            assertEquals("SEND_FAILED", result.targetState());
        }
    }

    // =========================================================================
    // SEND_FAILED transitions
    // =========================================================================
    @Nested
    @DisplayName("SEND_FAILED state transitions")
    class SendFailedTransitions {

        @Test
        @DisplayName("SEND_FAILED + RESEND -> SIGNED")
        void sendFailedResend() {
            TransitionResult result = stateMachine.transition(LttState.SEND_FAILED, "RESEND");
            assertTrue(result.success());
            assertEquals("SIGNED", result.targetState());
        }

        @Test
        @DisplayName("SEND_FAILED + CANCEL -> CANCELLED")
        void sendFailedCancel() {
            TransitionResult result = stateMachine.transition(LttState.SEND_FAILED, "CANCEL");
            assertTrue(result.success());
            assertEquals("CANCELLED", result.targetState());
        }
    }

    // =========================================================================
    // CONFIRMED transitions
    // =========================================================================
    @Nested
    @DisplayName("CONFIRMED state transitions")
    class ConfirmedTransitions {

        @Test
        @DisplayName("CONFIRMED + GL_SUCCESS -> POSTED")
        void confirmedGlSuccess() {
            TransitionResult result = stateMachine.transition(LttState.CONFIRMED, "GL_SUCCESS");
            assertTrue(result.success());
            assertEquals("POSTED", result.targetState());
        }

        @Test
        @DisplayName("CONFIRMED + GL_FAIL -> POST_FAILED")
        void confirmedGlFail() {
            TransitionResult result = stateMachine.transition(LttState.CONFIRMED, "GL_FAIL");
            assertTrue(result.success());
            assertEquals("POST_FAILED", result.targetState());
        }
    }

    // =========================================================================
    // POSTED transition
    // =========================================================================
    @Nested
    @DisplayName("POSTED state transitions")
    class PostedTransitions {

        @Test
        @DisplayName("POSTED + REVERSE -> REVERSED")
        void postedReverse() {
            TransitionResult result = stateMachine.transition(LttState.POSTED, "REVERSE");
            assertTrue(result.success());
            assertEquals("REVERSED", result.targetState());
        }
    }

    // =========================================================================
    // Final states — no transitions allowed
    // =========================================================================
    @Nested
    @DisplayName("Final states — no transitions")
    class FinalStates {

        @Test
        @DisplayName("POST_FAILED is a non-final state with no transitions")
        void postFailedNoTransitions() {
            TransitionResult result = stateMachine.transition(LttState.POST_FAILED, "SUBMIT");
            assertFalse(result.success());
        }

        @Test
        @DisplayName("CANCELLED is final — no transitions")
        void cancelledIsFinal() {
            assertTrue(LttState.CANCELLED.isFinal());
            TransitionResult result = stateMachine.transition(LttState.CANCELLED, "SUBMIT");
            assertFalse(result.success());
        }

        @Test
        @DisplayName("REVERSED is final — no transitions")
        void reversedIsFinal() {
            assertTrue(LttState.REVERSED.isFinal());
            TransitionResult result = stateMachine.transition(LttState.REVERSED, "SUBMIT");
            assertFalse(result.success());
        }

        @Test
        @DisplayName("POSTED is NOT final — can REVERSE to REVERSED")
        void postedIsNotFinal() {
            assertFalse(LttState.POSTED.isFinal());
        }
    }

    // =========================================================================
    // BLOCKED transitions
    // =========================================================================
    @Nested
    @DisplayName("BLOCKED state transitions")
    class BlockedTransitions {

        @Test
        @DisplayName("BLOCKED + UNBLOCK -> (previous_state)")
        void blockedUnblock() {
            TransitionResult result = stateMachine.transition(LttState.BLOCKED, "UNBLOCK");
            assertTrue(result.success());
            assertEquals("(previous_state)", result.targetState());
        }
    }

    // =========================================================================
    // Global BLOCK transition
    // =========================================================================
    @Nested
    @DisplayName("Global BLOCK transition")
    class GlobalBlock {

        @Test
        @DisplayName("Can block DRAFT")
        void canBlockDraft() {
            TransitionResult result = stateMachine.block(LttState.DRAFT);
            assertTrue(result.success());
            assertEquals("BLOCKED", result.targetState());
        }

        @Test
        @DisplayName("Can block SUBMITTED")
        void canBlockSubmitted() {
            TransitionResult result = stateMachine.block(LttState.SUBMITTED);
            assertTrue(result.success());
        }

        @Test
        @DisplayName("Can block POSTED (not final, can REVERSE)")
        void canBlockPosted() {
            TransitionResult result = stateMachine.block(LttState.POSTED);
            assertTrue(result.success());
        }

        @Test
        @DisplayName("Cannot block CANCELLED")
        void cannotBlockCancelled() {
            TransitionResult result = stateMachine.block(LttState.CANCELLED);
            assertFalse(result.success());
        }
    }

    // =========================================================================
    // canTransition and getAllowedEvents
    // =========================================================================
    @Nested
    @DisplayName("Helper methods")
    class HelperMethods {

        @Test
        @DisplayName("canTransition returns true for valid transitions")
        void canTransitionValid() {
            assertTrue(stateMachine.canTransition(LttState.DRAFT, "SUBMIT"));
            assertTrue(stateMachine.canTransition(LttState.SUBMITTED, "APPROVE_CHECK"));
        }

        @Test
        @DisplayName("canTransition returns false for invalid transitions")
        void canTransitionInvalid() {
            assertFalse(stateMachine.canTransition(LttState.DRAFT, "SIGN"));
            assertFalse(stateMachine.canTransition(LttState.CANCELLED, "SUBMIT"));
        }

        @Test
        @DisplayName("getAllowedEvents returns correct events for DRAFT")
        void allowedEventsDraft() {
            var events = stateMachine.getAllowedEvents(LttState.DRAFT);
            assertEquals(3, events.size());
            assertTrue(events.contains("SUBMIT"));
            assertTrue(events.contains("EDIT"));
            assertTrue(events.contains("DELETE"));
        }

        @Test
        @DisplayName("getAllowedEvents returns empty for final states")
        void allowedEventsFinal() {
            assertTrue(stateMachine.getAllowedEvents(LttState.CANCELLED).isEmpty());
            assertTrue(stateMachine.getAllowedEvents(LttState.REVERSED).isEmpty());
        }
    }
}
