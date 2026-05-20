package com.kb.ltt.application.usecase;

import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.application.usecase.DeletePayOrderUseCase.DeleteRequest;
import com.kb.ltt.domain.exception.BusinessException;
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
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for DeletePayOrderUseCase.
 */
@DisplayName("DeletePayOrderUseCase — integration")
class DeletePayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    DeletePayOrderUseCase deletePayOrderUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    private static final UserContext MAKER = new UserContext(
            "user-maker-01", List.of("PAY_OUT_MAKER"), "HN001", "127.0.0.1");

    @Test
    @DisplayName("happy path: delete DRAFT returns map with status=DELETED")
    void delete_draft_returnsDeletedMap() {
        PayOrderEntity entity = saveEntity("DRAFT", "user-maker-01");

        Map<String, Object> result = deletePayOrderUseCase.delete(
                entity.getId(),
                new DeleteRequest("Ly do xoa du de du 10 ky tu", true),
                MAKER,
                entity.getVersion(),
                "127.0.0.1");

        assertThat(result.get("status")).isEqualTo("DELETED");
        assertThat(result.get("id")).isEqualTo(entity.getId());
        assertThat(result.get("message").toString()).contains("MSG-OK-DELETE");
    }

    @Test
    @DisplayName("deleteReason too short → BusinessException")
    void delete_shortReason_throwsBusinessException() {
        PayOrderEntity entity = saveEntity("DRAFT", "user-maker-01");

        assertThatThrownBy(() ->
                deletePayOrderUseCase.delete(
                        entity.getId(),
                        new DeleteRequest("Short", true),
                        MAKER,
                        entity.getVersion(),
                        "127.0.0.1")
        )
        .isInstanceOf(BusinessException.class)
        .satisfies(ex -> assertThat(((BusinessException) ex).getCode())
                .isEqualTo("MSG-ERR-VALIDATION"));
    }

    @Test
    @DisplayName("confirmed=false → BusinessException")
    void delete_notConfirmed_throwsBusinessException() {
        PayOrderEntity entity = saveEntity("DRAFT", "user-maker-01");

        assertThatThrownBy(() ->
                deletePayOrderUseCase.delete(
                        entity.getId(),
                        new DeleteRequest("Ly do xoa du de du 10 ky tu", false),
                        MAKER,
                        entity.getVersion(),
                        "127.0.0.1")
        )
        .isInstanceOf(BusinessException.class)
        .satisfies(ex -> assertThat(((BusinessException) ex).getCode())
                .isEqualTo("MSG-ERR-VALIDATION"));
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
                .amount(BigDecimal.valueOf(1_000_000))
                .currencyCode("VND")
                .description("Delete test order")
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
}
