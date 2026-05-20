package com.kb.ltt.application.usecase;

import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.InvalidStatusTransitionException;
import com.kb.ltt.domain.exception.SoDViolationException;
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
 * Integration tests for CheckApprovePayOrderUseCase.
 */
@DisplayName("CheckApprovePayOrderUseCase — integration")
class CheckApprovePayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    CheckApprovePayOrderUseCase checkApprovePayOrderUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    private static final String MAKER_ID = "user-maker-01";
    private static final String CHECKER_ID = "user-checker-02";

    private static final UserContext CHECKER = new UserContext(
            CHECKER_ID, List.of("PAY_OUT_CHECKER"), "HN001", "127.0.0.1");

    private static final UserContext MAKER_AS_CHECKER = new UserContext(
            MAKER_ID, List.of("PAY_OUT_CHECKER"), "HN001", "127.0.0.1");

    @Test
    @DisplayName("happy path: READY_FOR_APPROVAL → PENDING_APPROVER")
    void checkApprove_happyPath_succeeds() {
        PayOrderEntity entity = saveEntity("READY_FOR_APPROVAL", MAKER_ID);

        Map<String, Object> result = checkApprovePayOrderUseCase.checkApprove(
                entity.getId(),
                new CheckApprovePayOrderUseCase.CheckApproveRequest("Đã kiểm tra, hợp lệ"),
                CHECKER,
                entity.getVersion(),
                "127.0.0.1");

        assertThat(result.get("status")).isEqualTo("PENDING_APPROVER");
        assertThat(result.get("id")).isEqualTo(entity.getId());
        assertThat(result.get("message").toString()).contains("MSG-OK-CHECK");

        // Verify DB state
        PayOrderEntity updated = payOrderRepository.findById(entity.getId()).orElseThrow();
        assertThat(updated.getCheckerId()).isEqualTo(CHECKER_ID);
        assertThat(updated.getCheckerActionAt()).isNotNull();
        assertThat(updated.getCheckerComment()).isEqualTo("Đã kiểm tra, hợp lệ");
    }

    @Test
    @DisplayName("SoD: checker == maker → SoDViolationException")
    void checkApprove_checkerIsMaker_throwsSoDViolation() {
        PayOrderEntity entity = saveEntity("READY_FOR_APPROVAL", MAKER_ID);

        assertThatThrownBy(() ->
                checkApprovePayOrderUseCase.checkApprove(
                        entity.getId(),
                        new CheckApprovePayOrderUseCase.CheckApproveRequest("comment"),
                        MAKER_AS_CHECKER,
                        entity.getVersion(),
                        "127.0.0.1"))
                .isInstanceOf(SoDViolationException.class);
    }

    @Test
    @DisplayName("wrong state (DRAFT) → InvalidStatusTransitionException")
    void checkApprove_wrongStatus_throwsInvalidStatusTransition() {
        PayOrderEntity entity = saveEntity("DRAFT", MAKER_ID);

        assertThatThrownBy(() ->
                checkApprovePayOrderUseCase.checkApprove(
                        entity.getId(),
                        new CheckApprovePayOrderUseCase.CheckApproveRequest("comment"),
                        CHECKER,
                        entity.getVersion(),
                        "127.0.0.1"))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private PayOrderEntity saveEntity(String status, String createdBy) {
        PayOrderEntity entity = PayOrderTestHelper.buildEntityWithStatus("HN001", createdBy, status);
        return payOrderRepository.save(entity);
    }
}
