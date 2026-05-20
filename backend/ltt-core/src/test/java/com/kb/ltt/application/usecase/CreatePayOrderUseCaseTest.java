package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.PayOrderLineRequest;
import com.kb.ltt.application.dto.PayOrderRequest;
import com.kb.ltt.application.dto.PayOrderResponse;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.repository.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for CreatePayOrderUseCase.
 */
@DisplayName("CreatePayOrderUseCase — integration")
class CreatePayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    CreatePayOrderUseCase createPayOrderUseCase;

    @Autowired
    AuditLogRepository auditLogRepository;

    private static final UserContext MAKER = new UserContext(
            "user-maker-01", List.of("PAY_OUT_MAKER"), "HN001", "127.0.0.1");

    @Test
    @DisplayName("happy path: create returns DRAFT PayOrder with id and refNo")
    void create_happyPath_returnsDraft() {
        PayOrderRequest request = buildRequest();
        String idemKey = UUID.randomUUID().toString();

        PayOrderResponse response = createPayOrderUseCase.create(request, MAKER, idemKey, "127.0.0.1");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getRefNo()).isNotNull().isNotBlank();
        assertThat(response.getStatus()).isEqualTo("DRAFT");
        assertThat(response.getKbnnId()).isEqualTo("HN001");
        assertThat(response.getCreatedBy()).isEqualTo("user-maker-01");
    }

    @Test
    @DisplayName("idempotency: same key + same body returns same response without new record")
    void create_sameIdempotencyKey_returnsIdenticalResponse() {
        PayOrderRequest request = buildRequest();
        String idemKey = UUID.randomUUID().toString();

        PayOrderResponse first = createPayOrderUseCase.create(request, MAKER, idemKey, "127.0.0.1");
        PayOrderResponse second = createPayOrderUseCase.create(request, MAKER, idemKey, "127.0.0.1");

        // Same ID — no duplicate created
        assertThat(second.getId()).isEqualTo(first.getId());
        assertThat(second.getRefNo()).isEqualTo(first.getRefNo());
    }

    @Test
    @DisplayName("audit log is recorded after creation")
    void create_recordsAuditLog() {
        PayOrderRequest request = buildRequest();
        String idemKey = UUID.randomUUID().toString();

        PayOrderResponse response = createPayOrderUseCase.create(request, MAKER, idemKey, "127.0.0.1");

        long auditCount = auditLogRepository.findAll().stream()
                .filter(a -> a.getEntityId().equals(response.getId())
                        && "CREATE".equals(a.getAction()))
                .count();

        assertThat(auditCount).isEqualTo(1);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    static PayOrderRequest buildRequest() {
        return PayOrderRequest.builder()
                .channel("IBPS")
                .sender("SENDER_01")
                .receiver("RECEIVER_01")
                .paymentDate(LocalDate.now())
                .currencyCode("VND")
                .description("Test payment description")
                .senderName("Nguyen Van A")
                .senderAddress("123 Le Loi, Ha Noi")
                .senderGlSegment2("0001")
                .senderBankCode("BIDV")
                .receiverName("Tran Thi B")
                .receiverGlSegment2("0001")
                .receiverBankCode("VCB")
                .receiverAccountName("Tran Thi B")
                .lines(List.of(
                        PayOrderLineRequest.builder()
                                .lineNum(1)
                                .lineAmount(BigDecimal.valueOf(1_000_000))
                                .lineDescription("Line 1 — Chi phi mua sam")
                                .build()
                ))
                .build();
    }
}
