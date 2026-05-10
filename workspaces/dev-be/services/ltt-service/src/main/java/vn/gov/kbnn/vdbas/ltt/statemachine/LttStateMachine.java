package vn.gov.kbnn.vdbas.ltt.statemachine;

import org.springframework.stereotype.Component;
import vn.gov.kbnn.vdbas.ltt.domain.enums.LttState;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * State machine cho LTT — 15 trang thai, ~20 transitions.
 * Dua tren states.yaml.
 *
 * Cac transition duoc dinh nghia theo cau truc:
 *   (currentState, event) -> targetState
 *
 * Moi transition co the co guard checking (thuc hien o service layer).
 */
@Component
public class LttStateMachine {

    /**
     * Dinh nghia transition: (currentState, event) -> targetState.
     */
    private final Map<LttState, Map<String, String>> transitions = new EnumMap<>(LttState.class);

    public LttStateMachine() {
        // DRAFT
        Map<String, String> draftTransitions = new java.util.HashMap<>();
        // Gia lap key-value thay vi dung enum cho event
        putTransition(draftTransitions, "SUBMIT", "SUBMITTED");
        putTransition(draftTransitions, "EDIT", "DRAFT");
        putTransition(draftTransitions, "DELETE", "(deleted)");
        transitions.put(LttState.DRAFT, draftTransitions);

        // SUBMITTED
        Map<String, String> submittedTransitions = new java.util.HashMap<>();
        putTransition(submittedTransitions, "APPROVE_CHECK", "IN_CONTROL");
        putTransition(submittedTransitions, "REJECT", "RETURNED_TO_MAKER");
        transitions.put(LttState.SUBMITTED, submittedTransitions);

        // IN_CONTROL
        Map<String, String> inControlTransitions = new java.util.HashMap<>();
        putTransition(inControlTransitions, "APPROVE", "APPROVED");
        putTransition(inControlTransitions, "REJECT", "RETURNED_TO_CHECKER");
        transitions.put(LttState.IN_CONTROL, inControlTransitions);

        // RETURNED_TO_MAKER
        Map<String, String> returnedMakerTransitions = new java.util.HashMap<>();
        putTransition(returnedMakerTransitions, "SUBMIT", "SUBMITTED");
        putTransition(returnedMakerTransitions, "EDIT", "DRAFT");
        putTransition(returnedMakerTransitions, "DELETE", "(deleted)");
        transitions.put(LttState.RETURNED_TO_MAKER, returnedMakerTransitions);

        // RETURNED_TO_CHECKER
        Map<String, String> returnedCheckerTransitions = new java.util.HashMap<>();
        putTransition(returnedCheckerTransitions, "SUBMIT", "IN_CONTROL");
        transitions.put(LttState.RETURNED_TO_CHECKER, returnedCheckerTransitions);

        // APPROVED
        Map<String, String> approvedTransitions = new java.util.HashMap<>();
        putTransition(approvedTransitions, "SIGN", "SIGNED");
        transitions.put(LttState.APPROVED, approvedTransitions);

        // SIGNED
        Map<String, String> signedTransitions = new java.util.HashMap<>();
        putTransition(signedTransitions, "SEND", "SENT");
        putTransition(signedTransitions, "CANCEL", "CANCELLED");
        transitions.put(LttState.SIGNED, signedTransitions);

        // SENT
        Map<String, String> sentTransitions = new java.util.HashMap<>();
        putTransition(sentTransitions, "CALLBACK_SUCCESS", "CONFIRMED");
        putTransition(sentTransitions, "CALLBACK_FAIL", "SEND_FAILED");
        transitions.put(LttState.SENT, sentTransitions);

        // SEND_FAILED
        Map<String, String> sendFailedTransitions = new java.util.HashMap<>();
        putTransition(sendFailedTransitions, "RESEND", "SIGNED");
        putTransition(sendFailedTransitions, "CANCEL", "CANCELLED");
        transitions.put(LttState.SEND_FAILED, sendFailedTransitions);

        // CONFIRMED
        Map<String, String> confirmedTransitions = new java.util.HashMap<>();
        putTransition(confirmedTransitions, "GL_SUCCESS", "POSTED");
        putTransition(confirmedTransitions, "GL_FAIL", "POST_FAILED");
        transitions.put(LttState.CONFIRMED, confirmedTransitions);

        // POSTED — chi co REVERSE
        Map<String, String> postedTransitions = new java.util.HashMap<>();
        putTransition(postedTransitions, "REVERSE", "REVERSED");
        transitions.put(LttState.POSTED, postedTransitions);

        // POST_FAILED, CANCELLED, REVERSED — khong co transition
        transitions.put(LttState.POST_FAILED, new java.util.HashMap<>());
        transitions.put(LttState.CANCELLED, new java.util.HashMap<>());
        transitions.put(LttState.REVERSED, new java.util.HashMap<>());

        // BLOCKED — chi UNBLOCK
        Map<String, String> blockedTransitions = new java.util.HashMap<>();
        putTransition(blockedTransitions, "UNBLOCK", "(previous_state)");
        transitions.put(LttState.BLOCKED, blockedTransitions);
    }

    private void putTransition(Map<String, String> map, String event, String target) {
        map.put(event, target);
    }

    /**
     * Thuc hien chuyen trang thai.
     *
     * @param currentState trang thai hien tai
     * @param event        su kien kich hoat
     * @return TransitionResult voi trang thai dich hoac loi
     */
    public TransitionResult transition(LttState currentState, String event) {
        if (currentState.isFinal()) {
            return TransitionResult.fail("E-VAL-031",
                    "LTT dang o trang thai [" + currentState + "], khong cho phep chuyen tiep");
        }

        Map<String, String> stateTransitions = transitions.get(currentState);
        if (stateTransitions == null) {
            return TransitionResult.fail("E-VAL-031",
                    "Khong tim thay transition cho trang thai [" + currentState + "]");
        }

        String targetState = stateTransitions.get(event);
        if (targetState == null) {
            return TransitionResult.fail("E-VAL-031",
                    "Khong cho phep [" + event + "] tu trang thai [" + currentState + "]");
        }

        // Xu ly cac transition dac biet
        if ("(deleted)".equals(targetState)) {
            return TransitionResult.ok("(deleted)");
        }

        if ("(previous_state)".equals(targetState)) {
            // UNBLOCK — targetState duoc xu ly boi service layer
            return TransitionResult.ok("(previous_state)");
        }

        return TransitionResult.ok(targetState);
    }

    /**
     * Kiem tra xem transition co hop le khong (khong thuc hien).
     */
    public boolean canTransition(LttState currentState, String event) {
        Map<String, String> stateTransitions = transitions.get(currentState);
        if (stateTransitions == null) return false;
        return stateTransitions.containsKey(event);
    }

    /**
     * Global BLOCK transition — tu bat ky non-final state nao.
     */
    public TransitionResult block(LttState currentState) {
        if (currentState.isFinal()) {
            return TransitionResult.fail("E-VAL-031",
                    "Khong the BLOCK trang thai cuoi [" + currentState + "]");
        }
        return TransitionResult.ok("BLOCKED");
    }

    /**
     * Lay danh sach events hop le cho trang thai.
     */
    public List<String> getAllowedEvents(LttState state) {
        Map<String, String> stateTransitions = transitions.get(state);
        if (stateTransitions == null) return List.of();
        return List.copyOf(stateTransitions.keySet());
    }
}
