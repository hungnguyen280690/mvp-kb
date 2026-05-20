package com.kb.ltt.application.usecase;

import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.domain.exception.OptimisticLockException;
import com.kb.ltt.domain.exception.SoDViolationException;
import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderLineEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for SubmitPayOrderUseCase.
 */
@DisplayName("SubmitPayOrderUseCase — integration")
class SubmitPayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    SubmitPayOrderUseCase submitPayOrderUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    private static final String MAKER_ID = "user-maker-01";
    private static final String OTHER_USER_ID = "user-other-99";

    private static final UserContext MAKER = new UserContext(
            MAKER_ID, List.of("PAY_OUT_MAKER"), "HN001", "127.0.0.1");

    private static final UserContext OTHER_USER = new UserContext(
            OTHER_USER_ID, List.of("PAY_OUT_MAKER"), "HN001", "127.0.0.1");

    @Test
    @DisplayName("happy path: DRAFT → READY_FOR_APPROVAL")
    void submit_fromDraft_succeeds() {
        PayOrderEntity entity = saveEntityWithLine("DRAFT", MAKER_ID);

        Map<String, Object> result = submitPayOrderUseCase.submit(
                entity.getId(),
                new SubmitPayOrderUseCase.SubmitRequest("submit comment"),
                MAKER,
                entity.getVersion(),
                "127.0.0.1");

        assertThat(result.get("status")).isEqualTo("READY_FOR_APPROVAL");
        assertThat(result.get("id")).isEqualTo(entity.getId());
        assertThat(result.get("message").toString()).contains("MSG-OK-SUBMIT");
    }

    @Test
    @DisplayName("happy path: RETURNED_TO_MAKER → READY_FOR_APPROVAL")
    void submit_fromReturnedToMaker_succeeds() {
        PayOrderEntity entity = saveEntityWithLine("RETURNED_TO_MAKER", MAKER_ID);

        Map<String, Object> result = submitPayOrderUseCase.submit(
                entity.getId(),
                new SubmitPayOrderUseCase.SubmitRequest("resubmit"),
                MAKER,
                entity.getVersion(),
                "127.0.0.1");

        assertThat(result.get("status")).isEqualTo("READY_FOR_APPROVAL");
    }

    @Test
    @DisplayName("wrong owner → SoDViolationException")
    void submit_wrongOwner_throwsSoDViolation() {
        PayOrderEntity entity = saveEntityWithLine("DRAFT", MAKER_ID);

        assertThatThrownBy(() ->
                submitPayOrderUseCase.submit(
                        entity.getId(),
                        new SubmitPayOrderUseCase.SubmitRequest("comment"),
                        OTHER_USER,
                        entity.getVersion(),
                        "127.0.0.1"))
                .isInstanceOf(SoDViolationException.class);
    }

    @Test
    @DisplayName("VAL-07 fail: sum of lines ≠ amount → BusinessException")
    void submit_amountMismatch_throwsBusinessException() {
        PayOrderEntity entity = saveDraftEntity(MAKER_ID);
        // Add a line with different amount than entity.amount (1_000_000)
        PayOrderLineEntity line = PayOrderTestHelper.buildLine(entity.getId(), BigDecimal.valueOf(500_000));
        entity.getLines().add(line);
        payOrderRepository.save(entity);
        // Refresh entity from DB to get correct version
        PayOrderEntity refreshed = payOrderRepository.findById(entity.getId()).orElseThrow();

        assertThatThrownBy(() ->
                submitPayOrderUseCase.submit(
                        refreshed.getId(),
                        new SubmitPayOrderUseCase.SubmitRequest("comment"),
                        MAKER,
                        refreshed.getVersion(),
                        "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("VAL-07");
    }

    @Test
    @DisplayName("wrong version → OptimisticLockException")
    void submit_wrongVersion_throwsOptimisticLock() {
        PayOrderEntity entity = saveEntityWithLine("DRAFT", MAKER_ID);
        long staleVersion = entity.getVersion() - 1;

        assertThatThrownBy(() ->
                submitPayOrderUseCase.submit(
                        entity.getId(),
                        new SubmitPayOrderUseCase.SubmitRequest("comment"),
                        MAKER,
                        staleVersion,
                        "127.0.0.1"))
                .isInstanceOf(OptimisticLockException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private PayOrderEntity saveDraftEntity(String createdBy) {
        PayOrderEntity entity = PayOrderTestHelper.buildDraftEntity("HN001", createdBy);
        return payOrderRepository.save(entity);
    }

    private PayOrderEntity saveEntityWithLine(String status, String createdBy) {
        PayOrderEntity entity = PayOrderTestHelper.buildEntityWithStatus("HN001", createdBy, status);
        PayOrderEntity saved = payOrderRepository.save(entity);
        PayOrderLineEntity line = PayOrderTestHelper.buildLine(saved.getId());
        saved.getLines().add(line);
        return payOrderRepository.save(saved);
    }
}
