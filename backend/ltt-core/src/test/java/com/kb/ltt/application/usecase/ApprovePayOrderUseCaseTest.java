package com.kb.ltt.application.usecase;

import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.SoDViolationException;
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
 * Integration tests for ApprovePayOrderUseCase.
 */
@DisplayName("ApprovePayOrderUseCase — integration")
class ApprovePayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    ApprovePayOrderUseCase approvePayOrderUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    private static final String MAKER_ID = "user-maker-01";
    private static final String CHECKER_ID = "user-checker-02";
    private static final String APPROVER_ID = "user-approver-03";

    private static final UserContext APPROVER = new UserContext(
            APPROVER_ID, List.of("PAY_OUT_APPROVER"), "HN001", "127.0.0.1");

    private static final UserContext MAKER_AS_APPROVER = new UserContext(
            MAKER_ID, List.of("PAY_OUT_APPROVER"), "HN001", "127.0.0.1");

    private static final UserContext CHECKER_AS_APPROVER = new UserContext(
            CHECKER_ID, List.of("PAY_OUT_APPROVER"), "HN001", "127.0.0.1");

    @Test
    @DisplayName("happy path: PENDING_APPROVER → APPROVED")
    void approve_happyPath_succeeds() {
        PayOrderEntity entity = saveEntityWithChecker("PENDING_APPROVER", MAKER_ID, CHECKER_ID);

        Map<String, Object> result = approvePayOrderUseCase.approve(
                entity.getId(),
                new ApprovePayOrderUseCase.ApproveRequest("Đồng ý phê duyệt"),
                APPROVER,
                entity.getVersion(),
                "127.0.0.1");

        assertThat(result.get("status")).isEqualTo("APPROVED");
        assertThat(result.get("id")).isEqualTo(entity.getId());
        assertThat(result.get("message").toString()).contains("MSG-OK-APPROVE");

        // Verify DB state
        PayOrderEntity updated = payOrderRepository.findById(entity.getId()).orElseThrow();
        assertThat(updated.getApproverId()).isEqualTo(APPROVER_ID);
        assertThat(updated.getApproverActionAt()).isNotNull();
        assertThat(updated.getApproverComment()).isEqualTo("Đồng ý phê duyệt");
    }

    @Test
    @DisplayName("SoD: approver == maker → SoDViolationException")
    void approve_approverIsMaker_throwsSoDViolation() {
        PayOrderEntity entity = saveEntityWithChecker("PENDING_APPROVER", MAKER_ID, CHECKER_ID);

        assertThatThrownBy(() ->
                approvePayOrderUseCase.approve(
                        entity.getId(),
                        new ApprovePayOrderUseCase.ApproveRequest("comment"),
                        MAKER_AS_APPROVER,
                        entity.getVersion(),
                        "127.0.0.1"))
                .isInstanceOf(SoDViolationException.class);
    }

    @Test
    @DisplayName("SoD: approver == checker → SoDViolationException")
    void approve_approverIsChecker_throwsSoDViolation() {
        PayOrderEntity entity = saveEntityWithChecker("PENDING_APPROVER", MAKER_ID, CHECKER_ID);

        assertThatThrownBy(() ->
                approvePayOrderUseCase.approve(
                        entity.getId(),
                        new ApprovePayOrderUseCase.ApproveRequest("comment"),
                        CHECKER_AS_APPROVER,
                        entity.getVersion(),
                        "127.0.0.1"))
                .isInstanceOf(SoDViolationException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private PayOrderEntity saveEntityWithChecker(String status, String createdBy, String checkerId) {
        PayOrderEntity entity = PayOrderTestHelper.buildEntityWithStatus("HN001", createdBy, status);
        entity.setCheckerId(checkerId);
        entity.setCheckerActionAt(Instant.now());
        return payOrderRepository.save(entity);
    }
}
