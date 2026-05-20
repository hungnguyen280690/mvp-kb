package com.kb.ltt.application.usecase;

import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests verifying PayOrderRepository basic operations.
 */
@DisplayName("PayOrderRepository — integration")
class PayOrderRepositoryTest extends BaseIntegrationTest {

    @Autowired
    PayOrderRepository payOrderRepository;

    @Test
    @DisplayName("save and findById return the same entity")
    void saveAndFindById_works() {
        PayOrderEntity entity = buildDraftEntity();
        payOrderRepository.save(entity);

        Optional<PayOrderEntity> found = payOrderRepository.findById(entity.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getRefNo()).isEqualTo(entity.getRefNo());
        assertThat(found.get().getStatus()).isEqualTo("DRAFT");
    }

    @Test
    @DisplayName("@Version increments on save")
    void version_incrementsOnUpdate() {
        PayOrderEntity entity = buildDraftEntity();
        // Use saveAndFlush to force the initial INSERT to the DB and assign version=0
        PayOrderEntity saved = payOrderRepository.saveAndFlush(entity);

        Long versionAfterCreate = saved.getVersion();
        assertThat(versionAfterCreate).isNotNull();

        // Update a field and flush again to trigger the UPDATE + version increment
        saved.setDescription("Updated description for version test");
        PayOrderEntity updated = payOrderRepository.saveAndFlush(saved);

        // JPA @Version increments from 0 to 1
        assertThat(updated.getVersion()).isGreaterThan(versionAfterCreate);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    static PayOrderEntity buildDraftEntity() {
        return PayOrderEntity.builder()
                .id(UUID.randomUUID().toString())
                .status("DRAFT")
                .refNo("HN001-202605-000001")
                .channel("IBPS")
                .sender("SENDER_01")
                .receiver("RECEIVER_01")
                .paymentDate(LocalDate.now())
                .amount(BigDecimal.valueOf(1_000_000))
                .currencyCode("VND")
                .description("Test payment order")
                .senderName("Nguyen Van A")
                .senderAddress("123 Le Loi, HN")
                .senderGlSegment2("0001")
                .senderBankCode("BIDV")
                .receiverName("Tran Thi B")
                .receiverGlSegment2("0001")
                .receiverBankCode("VCB")
                .receiverAccountName("Tran Thi B")
                .kbnnId("HN001")
                .createdBy("user-maker-01")
                .createdAt(Instant.now())
                .lines(new ArrayList<>())
                .attachments(new ArrayList<>())
                .build();
    }
}
