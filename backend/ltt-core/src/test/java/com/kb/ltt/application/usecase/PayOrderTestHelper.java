package com.kb.ltt.application.usecase;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderLineEntity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.UUID;

/**
 * Static factory helpers for creating PayOrderEntity and PayOrderLineEntity in tests.
 */
public class PayOrderTestHelper {

    /**
     * Builds a valid PayOrderEntity in DRAFT status with all required fields set.
     * Amount is set to 1_000_000 to match a single line of the same amount.
     */
    public static PayOrderEntity buildDraftEntity(String kbnnId, String createdBy) {
        return PayOrderEntity.builder()
                .id(UUID.randomUUID().toString())
                .status("DRAFT")
                .refNo("HN001-202605-000001")
                .channel("LNH")
                .sender("HN001")
                .receiver("HN002")
                .paymentDate(LocalDate.now())
                .amount(BigDecimal.valueOf(1_000_000))
                .currencyCode("VND")
                .description("Test thanh toan")
                .senderName("Test Sender")
                .senderAddress("123 Test St")
                .senderGlSegment2("1111")
                .senderBankCode("HN001")
                .receiverName("Test Receiver")
                .receiverGlSegment2("ACC001")
                .receiverBankCode("HN002")
                .receiverAccountName("Test Receiver Name")
                .kbnnId(kbnnId)
                .createdBy(createdBy)
                .createdAt(Instant.now())
                .lines(new ArrayList<>())
                .attachments(new ArrayList<>())
                .build();
    }

    /**
     * Builds a valid PayOrderEntity in the given status with all required fields set.
     */
    public static PayOrderEntity buildEntityWithStatus(String kbnnId, String createdBy, String status) {
        PayOrderEntity entity = buildDraftEntity(kbnnId, createdBy);
        entity.setStatus(status);
        return entity;
    }

    /**
     * Builds a PayOrderLineEntity with all required fields and lineAmount=1_000_000.
     */
    public static PayOrderLineEntity buildLine(String orderId) {
        return PayOrderLineEntity.builder()
                .id(UUID.randomUUID().toString())
                .orderId(orderId)
                .lineNum(1)
                .lineAmount(BigDecimal.valueOf(1_000_000))
                .ccidSegment1("S1")
                .ccidSegment2("S2")
                .ccidSegment3("S3")
                .ccidSegment4("S4")
                .ccidSegment5("S5")
                .ccidSegment6("S6")
                .ccidSegment7("S7")
                .ccidSegment8("S8")
                .ccidSegment9("S9")
                .ccidSegment10("S10")
                .ccidSegment11("S11")
                .ccidSegment12("S12")
                .build();
    }

    /**
     * Builds a PayOrderLineEntity with a custom amount.
     */
    public static PayOrderLineEntity buildLine(String orderId, BigDecimal amount) {
        PayOrderLineEntity line = buildLine(orderId);
        line.setLineAmount(amount);
        return line;
    }
}
