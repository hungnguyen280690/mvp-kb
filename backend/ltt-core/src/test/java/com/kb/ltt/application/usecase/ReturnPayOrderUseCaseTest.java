package com.kb.ltt.application.usecase;

import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for ReturnPayOrderUseCase.
 */
@DisplayName("ReturnPayOrderUseCase — integration")
class ReturnPayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    ReturnPayOrderUseCase returnPayOrderUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    private static final String MAKER_ID = "user-maker-01";
    private static final String CHECKER_ID = "user-checker-02";
    private static final String APPROVER_ID = "user-approver-03";

    private static final UserContext CHECKER = new UserContext(
            CHECKER_ID, List.of("PAY_OUT_CHECKER"), "HN001", "127.0.0.1");

    private static final UserContext APPROVER = new UserContext(
            APPROVER_ID, List.of("PAY_OUT_APPROVER"), "HN001", "127.0.0.1");

    private static final String VALID_REASON = "Số tiền không khớp với hóa đơn gốc";

    @Test
    @DisplayName("happy path: return from READY_FOR_APPROVAL")
    void returnToMaker_fromReady_succeeds() {
        PayOrderEntity entity = saveEntity("READY_FOR_APPROVAL", MAKER_ID);

        Map<String, Object> result = returnPayOrderUseCase.returnToMaker(
                entity.getId(),
                new ReturnPayOrderUseCase.ReturnRequest(VALID_REASON),
                CHECKER,
                entity.getVersion(),
                "127.0.0.1");

        assertThat(result.get("status")).isEqualTo("RETURNED_TO_MAKER");
        assertThat(result.get("message").toString()).contains("MSG-OK-RETURN");

        PayOrderEntity updated = payOrderRepository.findById(entity.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("RETURNED_TO_MAKER");
        assertThat(updated.getCheckerComment()).isEqualTo(VALID_REASON);
    }

    @Test
    @DisplayName("happy path: return from PENDING_APPROVER")
    void returnToMaker_fromPending_succeeds() {
        PayOrderEntity entity = saveEntityWithChecker("PENDING_APPROVER", MAKER_ID, CHECKER_ID);

        Map<String, Object> result = returnPayOrderUseCase.returnToMaker(
                entity.getId(),
                new ReturnPayOrderUseCase.ReturnRequest(VALID_REASON),
                APPROVER,
                entity.getVersion(),
                "127.0.0.1");

        assertThat(result.get("status")).isEqualTo("RETURNED_TO_MAKER");

        PayOrderEntity updated = payOrderRepository.findById(entity.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("RETURNED_TO_MAKER");
        assertThat(updated.getApproverComment()).isEqualTo(VALID_REASON);
    }

    @Test
    @DisplayName("reason too short (< 10 chars) → BusinessException")
    void returnToMaker_shortReason_throwsBusinessException() {
        PayOrderEntity entity = saveEntity("READY_FOR_APPROVAL", MAKER_ID);

        assertThatThrownBy(() ->
                returnPayOrderUseCase.returnToMaker(
                        entity.getId(),
                        new ReturnPayOrderUseCase.ReturnRequest("Sai"),
                        CHECKER,
                        entity.getVersion(),
                        "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("≥ 10 ký tự");
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private PayOrderEntity saveEntity(String status, String createdBy) {
        PayOrderEntity entity = PayOrderTestHelper.buildEntityWithStatus("HN001", createdBy, status);
        return payOrderRepository.save(entity);
    }

    private PayOrderEntity saveEntityWithChecker(String status, String createdBy, String checkerId) {
        PayOrderEntity entity = PayOrderTestHelper.buildEntityWithStatus("HN001", createdBy, status);
        entity.setCheckerId(checkerId);
        entity.setCheckerActionAt(Instant.now());
        return payOrderRepository.save(entity);
    }
}
