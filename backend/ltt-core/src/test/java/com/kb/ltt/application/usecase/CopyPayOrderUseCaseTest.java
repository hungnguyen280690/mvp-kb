package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.PayOrderResponse;
import com.kb.ltt.application.model.UserContext;
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

/**
 * Integration tests for CopyPayOrderUseCase.
 */
@DisplayName("CopyPayOrderUseCase — integration")
class CopyPayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    CopyPayOrderUseCase copyPayOrderUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    private static final UserContext MAKER = new UserContext(
            "user-maker-01", List.of("PAY_OUT_MAKER"), "HN001", "127.0.0.1");

    @Test
    @DisplayName("happy path: copy returns new entity with new id, new refNo, status=DRAFT")
    void copy_happyPath_returnsNewDraft() {
        PayOrderEntity source = saveEntity("APPROVED");
        String idemKey = UUID.randomUUID().toString();

        PayOrderResponse response = copyPayOrderUseCase.copy(
                source.getId(),
                LocalDate.now().plusDays(1),
                MAKER,
                idemKey,
                "127.0.0.1");

        // New identity
        assertThat(response.getId()).isNotEqualTo(source.getId());
        assertThat(response.getRefNo()).isNotEqualTo(source.getRefNo());
        assertThat(response.getStatus()).isEqualTo("DRAFT");

        // Ownership transferred to requesting user
        assertThat(response.getCreatedBy()).isEqualTo("user-maker-01");
        assertThat(response.getKbnnId()).isEqualTo("HN001");

        // Payment date overridden
        assertThat(response.getPaymentDate()).isEqualTo(LocalDate.now().plusDays(1));

        // Workflow fields cleared
        assertThat(response.getCheckerId()).isNull();
        assertThat(response.getApproverId()).isNull();
    }

    @Test
    @DisplayName("copy from source with no explicit paymentDate uses today")
    void copy_noPaymentDate_usesToday() {
        PayOrderEntity source = saveEntity("DRAFT");

        PayOrderResponse response = copyPayOrderUseCase.copy(
                source.getId(),
                null,   // no explicit date
                MAKER,
                null,
                "127.0.0.1");

        assertThat(response.getPaymentDate()).isEqualTo(LocalDate.now());
        assertThat(response.getStatus()).isEqualTo("DRAFT");
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private PayOrderEntity saveEntity(String status) {
        PayOrderEntity entity = PayOrderEntity.builder()
                .id(UUID.randomUUID().toString())
                .status(status)
                .refNo("HN001-202605-" + UUID.randomUUID().toString().substring(0, 6))
                .channel("IBPS")
                .sender("S01")
                .receiver("R01")
                .paymentDate(LocalDate.of(2026, 5, 1))
                .amount(BigDecimal.valueOf(2_000_000))
                .currencyCode("VND")
                .description("Source payment order for copy")
                .senderName("Nguyen Van A")
                .senderAddress("123 Le Loi")
                .senderGlSegment2("0001")
                .senderBankCode("BIDV")
                .receiverName("Tran Thi B")
                .receiverGlSegment2("0001")
                .receiverBankCode("VCB")
                .receiverAccountName("Tran Thi B")
                .kbnnId("HN001")
                .createdBy("user-original-maker")
                .checkerId("user-checker-01")
                .approverId("user-approver-01")
                .lines(new ArrayList<>())
                .attachments(new ArrayList<>())
                .build();
        return payOrderRepository.save(entity);
    }
}
