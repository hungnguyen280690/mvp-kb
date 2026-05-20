package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.PayOrderRequest;
import com.kb.ltt.application.dto.PayOrderResponse;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.InvalidStatusTransitionException;
import com.kb.ltt.domain.exception.OptimisticLockException;
import com.kb.ltt.domain.exception.SoDViolationException;
import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for UpdatePayOrderUseCase.
 */
@DisplayName("UpdatePayOrderUseCase — integration")
class UpdatePayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    UpdatePayOrderUseCase updatePayOrderUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    private static final UserContext MAKER = new UserContext(
            "user-maker-01", List.of("PAY_OUT_MAKER"), "HN001", "127.0.0.1");

    private static final UserContext OTHER_USER = new UserContext(
            "user-other-99", List.of("PAY_OUT_MAKER"), "HN001", "127.0.0.1");

    @Test
    @DisplayName("happy path: update DRAFT order succeeds")
    void update_draftOrder_succeeds() {
        PayOrderEntity entity = saveEntity("DRAFT", "user-maker-01");
        PayOrderRequest request = buildUpdateRequest("Updated description for test");

        PayOrderResponse response = updatePayOrderUseCase.update(
                entity.getId(), request, MAKER, entity.getVersion(), null, "127.0.0.1");

        assertThat(response.getDescription()).isEqualTo("Updated description for test");
        assertThat(response.getUpdatedBy()).isEqualTo("user-maker-01");
    }

    @Test
    @DisplayName("wrong owner → SoDViolationException")
    void update_wrongOwner_throwsSoDViolation() {
        PayOrderEntity entity = saveEntity("DRAFT", "user-maker-01");
        PayOrderRequest request = buildUpdateRequest("Should fail");

        assertThatThrownBy(() ->
                updatePayOrderUseCase.update(
                        entity.getId(), request, OTHER_USER, entity.getVersion(), null, "127.0.0.1")
        ).isInstanceOf(SoDViolationException.class);
    }

    @Test
    @DisplayName("wrong status (READY_FOR_APPROVAL) → InvalidStatusTransitionException")
    void update_wrongStatus_throwsInvalidStatusTransition() {
        PayOrderEntity entity = saveEntity("READY_FOR_APPROVAL", "user-maker-01");
        PayOrderRequest request = buildUpdateRequest("Should fail");

        assertThatThrownBy(() ->
                updatePayOrderUseCase.update(
                        entity.getId(), request, MAKER, entity.getVersion(), null, "127.0.0.1")
        ).isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    @DisplayName("stale version → OptimisticLockException")
    void update_wrongVersion_throwsOptimisticLock() {
        PayOrderEntity entity = saveEntity("DRAFT", "user-maker-01");
        long staleVersion = entity.getVersion() - 1;
        PayOrderRequest request = buildUpdateRequest("Should fail");

        assertThatThrownBy(() ->
                updatePayOrderUseCase.update(
                        entity.getId(), request, MAKER, staleVersion, null, "127.0.0.1")
        ).isInstanceOf(OptimisticLockException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private PayOrderEntity saveEntity(String status, String createdBy) {
        PayOrderEntity entity = PayOrderEntity.builder()
                .id(UUID.randomUUID().toString())
                .status(status)
                .refNo("HN001-202605-" + UUID.randomUUID().toString().substring(0, 6))
                .channel("IBPS")
                .sender("S01")
                .receiver("R01")
                .paymentDate(LocalDate.now())
                .amount(BigDecimal.valueOf(500_000))
                .currencyCode("VND")
                .description("Original description")
                .senderName("Nguyen Van A")
                .senderAddress("123 Le Loi")
                .senderGlSegment2("0001")
                .senderBankCode("BIDV")
                .receiverName("Tran Thi B")
                .receiverGlSegment2("0001")
                .receiverBankCode("VCB")
                .receiverAccountName("Tran Thi B")
                .kbnnId("HN001")
                .createdBy(createdBy)
                .lines(new ArrayList<>())
                .attachments(new ArrayList<>())
                .build();
        return payOrderRepository.save(entity);
    }

    private PayOrderRequest buildUpdateRequest(String description) {
        return PayOrderRequest.builder()
                .channel("IBPS")
                .sender("S01")
                .receiver("R01")
                .paymentDate(LocalDate.now())
                .currencyCode("VND")
                .description(description)
                .senderName("Nguyen Van A Updated")
                .senderAddress("456 Ba Trieu, HN")
                .senderGlSegment2("0001")
                .senderBankCode("BIDV")
                .receiverName("Tran Thi B")
                .receiverGlSegment2("0001")
                .receiverBankCode("VCB")
                .receiverAccountName("Tran Thi B")
                .lines(new ArrayList<>())
                .build();
    }
}
