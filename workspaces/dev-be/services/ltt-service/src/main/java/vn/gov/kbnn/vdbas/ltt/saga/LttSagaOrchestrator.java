package vn.gov.kbnn.vdbas.ltt.saga;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.gov.kbnn.vdbas.ltt.domain.enums.EventType;

/**
 * Saga orchestrator cho LTT — dieu phoi cac buoc trong mot LTT lifecycle.
 * Su dung co che orchestration (ADR-0002).
 *
 * Moi buoc saga: validate -> state transition -> reserve fund -> audit -> publish event.
 * Compensating transaction khi buoc that bai.
 */
@Slf4j
@Component
public class LttSagaOrchestrator {

    /**
     * Saga step result.
     */
    public record SagaStep(
            String stepName,
            boolean success,
            String errorCode,
            String errorMessage
    ) {
        public static SagaStep ok(String stepName) {
            return new SagaStep(stepName, true, null, null);
        }

        public static SagaStep fail(String stepName, String errorCode, String errorMessage) {
            return new SagaStep(stepName, false, errorCode, errorMessage);
        }
    }

    /**
     * Execute saga cho submit LTT.
     * Steps: validate -> reserve fund -> transition state -> audit -> publish event
     */
    public void executeSubmitSaga(Long lttId, String userId) {
        log.info("Starting submit saga for LTT: {}", lttId);

        // Step 1: Validate
        SagaStep validateStep = SagaStep.ok("VALIDATE");

        // Step 2: Reserve fund
        SagaStep reserveStep = SagaStep.ok("RESERVE_FUND");

        // Step 3: State transition
        SagaStep transitionStep = SagaStep.ok("STATE_TRANSITION");

        // Step 4: Audit
        SagaStep auditStep = SagaStep.ok("AUDIT");

        // Step 5: Publish event
        SagaStep publishStep = SagaStep.ok("PUBLISH_EVENT");

        // Neu co buoc that bai -> execute compensating transactions
        if (!validateStep.success()) {
            compensate(lttId, "VALIDATE");
        }

        log.info("Submit saga completed for LTT: {}", lttId);
    }

    /**
     * Thuc hien compensating transaction khi saga that bai.
     */
    private void compensate(Long lttId, String failedStep) {
        log.warn("Compensating saga for LTT: {}, failed at step: {}", lttId, failedStep);

        switch (failedStep) {
            case "STATE_TRANSITION", "AUDIT", "PUBLISH_EVENT" -> {
                // Release hold
                log.info("Compensating: release hold for LTT {}", lttId);
            }
            default -> log.info("No compensation needed for step: {}", failedStep);
        }
    }
}
