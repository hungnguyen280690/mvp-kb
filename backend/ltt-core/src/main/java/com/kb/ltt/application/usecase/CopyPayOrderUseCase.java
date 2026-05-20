package com.kb.ltt.application.usecase;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kb.ltt.application.dto.PayOrderResponse;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderLineEntity;
import com.kb.ltt.infrastructure.persistence.mapper.PayOrderMapper;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import com.kb.ltt.infrastructure.service.AuditHashChainService;
import com.kb.ltt.infrastructure.service.IdempotencyResult;
import com.kb.ltt.infrastructure.service.IdempotencyService;
import com.kb.ltt.infrastructure.service.RefNoGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Copies an existing PayOrder to a new DRAFT order.
 * Supports idempotency via the Idempotency-Key header.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CopyPayOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final PayOrderMapper mapper;
    private final RefNoGeneratorService refNoGeneratorService;
    private final AuditHashChainService auditHashChainService;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @Transactional
    public PayOrderResponse copy(String sourceId,
                                 LocalDate paymentDate,
                                 UserContext user,
                                 String idempotencyKey,
                                 String ip) {
        // Idempotency check
        String idemKey = idempotencyKey != null ? idempotencyKey : "";
        if (!idemKey.isBlank()) {
            IdempotencyResult idem = idempotencyService.check(idemKey, sourceId);
            if (idem.shouldReplay()) {
                log.debug("CopyPayOrder idempotency replay for key={}", idemKey);
                return fromJson(idem.cachedBody(), PayOrderResponse.class);
            }
        }

        // 1. Find source entity (any status)
        PayOrderEntity source = payOrderRepository.findById(sourceId)
                .orElseThrow(() -> new BusinessException(
                        "MSG-ERR-NOT-FOUND", "Source PayOrder not found: " + sourceId));

        // 2. New identity
        String newId = UUID.randomUUID().toString();
        String newRefNo = refNoGeneratorService.generate(user.kbnnId());
        Instant now = Instant.now();

        // 3. Clone entity — override identity and workflow fields
        PayOrderEntity copy = PayOrderEntity.builder()
                .id(newId)
                .status("DRAFT")
                .version(null)   // JPA will assign the initial version
                .refNo(newRefNo)
                .channel(source.getChannel())
                .orderType(source.getOrderType())
                .lnhTransactionType(source.getLnhTransactionType())
                .sender(source.getSender())
                .receiver(source.getReceiver())
                .paymentDate(paymentDate != null ? paymentDate : LocalDate.now())
                .amount(source.getAmount())
                .currencyCode(source.getCurrencyCode())
                .exchangeRate(source.getExchangeRate())
                .originNum(source.getOriginNum())
                .transactionDate(source.getTransactionDate())
                .expType(source.getExpType())
                .fnCode1(source.getFnCode1())
                .fnCode2(source.getFnCode2())
                .fnAmount(source.getFnAmount())
                .description(source.getDescription())
                .senderName(source.getSenderName())
                .senderAddress(source.getSenderAddress())
                .senderGlSegment2(source.getSenderGlSegment2())
                .senderNum(source.getSenderNum())
                .senderBankCode(source.getSenderBankCode())
                .senderIdentifyId(source.getSenderIdentifyId())
                .senderIssuedDate(source.getSenderIssuedDate())
                .senderIssuedPlace(source.getSenderIssuedPlace())
                .tpcpCode(source.getTpcpCode())
                .receiverName(source.getReceiverName())
                .receiverAddress(source.getReceiverAddress())
                .receiverGlSegment2(source.getReceiverGlSegment2())
                .receiverBankCode(source.getReceiverBankCode())
                .receiverAccountName(source.getReceiverAccountName())
                .receiverIdentifyId(source.getReceiverIdentifyId())
                .receiverIssuedDate(source.getReceiverIssuedDate())
                .receiverIssuedPlace(source.getReceiverIssuedPlace())
                // New ownership
                .kbnnId(user.kbnnId())
                .createdBy(user.userId())
                .createdAt(now)
                .createdIp(ip)
                // Clear workflow fields
                .checkerId(null)
                .checkerActionAt(null)
                .checkerComment(null)
                .approverId(null)
                .approverActionAt(null)
                .approverComment(null)
                .deleteReason(null)
                .deletedBy(null)
                .deletedAt(null)
                .deletedIp(null)
                .updatedBy(null)
                .updatedAt(null)
                .updatedIp(null)
                .idempotencyKey(idempotencyKey)
                .lines(new ArrayList<>())
                .attachments(new ArrayList<>())
                .build();

        // 4. Clone lines with new UUIDs
        if (source.getLines() != null) {
            List<PayOrderLineEntity> clonedLines = new ArrayList<>();
            for (PayOrderLineEntity srcLine : source.getLines()) {
                PayOrderLineEntity cloned = PayOrderLineEntity.builder()
                        .id(UUID.randomUUID().toString())
                        .orderId(newId)
                        .lineNum(srcLine.getLineNum())
                        .lineAmount(srcLine.getLineAmount())
                        .lineDescription(srcLine.getLineDescription())
                        .ccidSegment1(srcLine.getCcidSegment1())
                        .ccidSegment2(srcLine.getCcidSegment2())
                        .ccidSegment3(srcLine.getCcidSegment3())
                        .ccidSegment4(srcLine.getCcidSegment4())
                        .ccidSegment5(srcLine.getCcidSegment5())
                        .ccidSegment6(srcLine.getCcidSegment6())
                        .ccidSegment7(srcLine.getCcidSegment7())
                        .ccidSegment8(srcLine.getCcidSegment8())
                        .ccidSegment9(srcLine.getCcidSegment9())
                        .ccidSegment10(srcLine.getCcidSegment10())
                        .ccidSegment11(srcLine.getCcidSegment11())
                        .ccidSegment12(srcLine.getCcidSegment12())
                        .createdAt(now)
                        .build();
                clonedLines.add(cloned);
            }
            copy.getLines().addAll(clonedLines);
        }

        // 5. Save
        PayOrderEntity saved = payOrderRepository.save(copy);

        // 6. Audit
        auditHashChainService.record(
                "PAY_ORDER", newId, "COPY",
                user.userId(), ip,
                null, saved.getVersion(),
                toJson(saved));

        // 7. Response
        PayOrderResponse response = mapper.toResponse(saved);

        // 8. Store idempotency result
        if (!idemKey.isBlank()) {
            idempotencyService.store(idemKey, sourceId, 201, toJson(response));
        }

        log.info("PayOrder copied: sourceId={} newId={} newRefNo={} by={}",
                sourceId, newId, newRefNo, user.userId());
        return response;
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private <T> T fromJson(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot deserialise idempotency cache", e);
        }
    }
}
