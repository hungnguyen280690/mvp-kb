package com.kb.ltt.application.usecase;

import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for RejectPayOrderUseCase.
 */
@DisplayName("RejectPayOrderUseCase — integration")
class RejectPayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    RejectPayOrderUseCase rejectPayOrderUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    private static final String MAKER_ID = "user-maker-01";
    private static final String CHECKER_ID = "user-checker-02";

    private static final UserContext CHECKER = new UserContext(
            CHECKER_ID, List.of("PAY_OUT_CHECKER"), "HN001", "127.0.0.1");

    private static final String VALID_REASON = "Không đủ điều kiện thanh toán theo quy định";

    @Test
    @DisplayName("happy path: reject from READY_FOR_APPROVAL → REJECTED")
    void reject_fromReady_succeeds() {
        PayOrderEntity entity = saveEntity("READY_FOR_APPROVAL", MAKER_ID);

        Map<String, Object> result = rejectPayOrderUseCase.reject(
                entity.getId(),
                new RejectPayOrderUseCase.RejectRequest(VALID_REASON),
                CHECKER,
                entity.getVersion(),
                "127.0.0.1");

        assertThat(result.get("status")).isEqualTo("REJECTED");
        assertThat(result.get("message").toString()).contains("MSG-OK-REJECT");

        PayOrderEntity updated = payOrderRepository.findById(entity.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("REJECTED");
        assertThat(updated.getCheckerComment()).isEqualTo(VALID_REASON);
    }

    @Test
    @DisplayName("reason too short (< 10 chars) → BusinessException")
    void reject_shortReason_throwsBusinessException() {
        PayOrderEntity entity = saveEntity("READY_FOR_APPROVAL", MAKER_ID);

        assertThatThrownBy(() ->
                rejectPayOrderUseCase.reject(
                        entity.getId(),
                        new RejectPayOrderUseCase.RejectRequest("Sai"),
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
}
