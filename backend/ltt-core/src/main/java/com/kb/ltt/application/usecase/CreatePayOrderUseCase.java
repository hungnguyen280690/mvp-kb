package com.kb.ltt.application.usecase;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kb.ltt.application.dto.PayOrderLineRequest;
import com.kb.ltt.application.dto.PayOrderRequest;
import com.kb.ltt.application.dto.PayOrderResponse;
import com.kb.ltt.application.model.UserContext;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Creates a new PayOrder in DRAFT status.
 * Implements idempotency guard (ADR-0005) and audit hash-chain (ADR-0003).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CreatePayOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final PayOrderMapper mapper;
    private final RefNoGeneratorService refNoGeneratorService;
    private final AuditHashChainService auditHashChainService;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @Transactional
    public PayOrderResponse create(PayOrderRequest request,
                                   UserContext user,
                                   String idempotencyKey,
                                   String ip) {
        // 1. Idempotency check
        String requestJson = toJson(request);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            IdempotencyResult idem = idempotencyService.check(idempotencyKey, requestJson);
            if (idem.shouldReplay()) {
                log.debug("Idempotency replay for key={}", idempotencyKey);
                return fromJson(idem.cachedBody(), PayOrderResponse.class);
            }
        }

        // 2. Generate UUID id
        String id = UUID.randomUUID().toString();

        // 3. Generate REF_NO
        String refNo = refNoGeneratorService.generate(user.kbnnId());

        // 4. Compute amount = sum of line amounts (or 0 if no lines)
        BigDecimal amount = BigDecimal.ZERO;
        if (request.getLines() != null) {
            amount = request.getLines().stream()
                    .filter(l -> l.getLineAmount() != null)
                    .map(PayOrderLineRequest::getLineAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // 5. Build entity
        Instant now = Instant.now();
        PayOrderEntity entity = PayOrderEntity.builder()
                .id(id)
                .status("DRAFT")
                .version(null)   // let JPA @Version handle initial value
                .refNo(refNo)
                .channel(request.getChannel())
                .orderType(request.getOrderType())
                .lnhTransactionType(request.getLnhTransactionType())
                .sender(request.getSender())
                .receiver(request.getReceiver())
                .paymentDate(request.getPaymentDate())
                .amount(amount)
                .currencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "VND")
                .exchangeRate(request.getExchangeRate())
                .originNum(request.getOriginNum())
                .transactionDate(request.getTransactionDate())
                .expType(request.getExpType())
                .fnCode1(request.getFnCode1())
                .fnCode2(request.getFnCode2())
                .fnAmount(request.getFnAmount())
                .description(request.getDescription())
                .senderName(request.getSenderName())
                .senderAddress(request.getSenderAddress())
                .senderGlSegment2(request.getSenderGlSegment2())
                .senderNum(request.getSenderNum())
                .senderBankCode(request.getSenderBankCode())
                .senderIdentifyId(request.getSenderIdentifyId())
                .senderIssuedDate(request.getSenderIssuedDate())
                .senderIssuedPlace(request.getSenderIssuedPlace())
                .tpcpCode(request.getTpcpCode())
                .receiverName(request.getReceiverName())
                .receiverAddress(request.getReceiverAddress())
                .receiverGlSegment2(request.getReceiverGlSegment2())
                .receiverBankCode(request.getReceiverBankCode())
                .receiverAccountName(request.getReceiverAccountName())
                .receiverIdentifyId(request.getReceiverIdentifyId())
                .receiverIssuedDate(request.getReceiverIssuedDate())
                .receiverIssuedPlace(request.getReceiverIssuedPlace())
                .kbnnId(user.kbnnId())
                .createdBy(user.userId())
                .createdAt(now)
                .createdIp(ip)
                .idempotencyKey(idempotencyKey)
                .lines(new ArrayList<>())
                .attachments(new ArrayList<>())
                .build();

        // 6. Map lines
        if (request.getLines() != null) {
            List<PayOrderLineEntity> lineEntities = new ArrayList<>();
            for (PayOrderLineRequest lineReq : request.getLines()) {
                PayOrderLineEntity lineEntity = PayOrderLineEntity.builder()
                        .id(UUID.randomUUID().toString())
                        .orderId(id)
                        .lineNum(lineReq.getLineNum())
                        .lineAmount(lineReq.getLineAmount())
                        .lineDescription(lineReq.getLineDescription())
                        .ccidSegment1(lineReq.getCcidSegment1())
                        .ccidSegment2(lineReq.getCcidSegment2())
                        .ccidSegment3(lineReq.getCcidSegment3())
                        .ccidSegment4(lineReq.getCcidSegment4())
                        .ccidSegment5(lineReq.getCcidSegment5())
                        .ccidSegment6(lineReq.getCcidSegment6())
                        .ccidSegment7(lineReq.getCcidSegment7())
                        .ccidSegment8(lineReq.getCcidSegment8())
                        .ccidSegment9(lineReq.getCcidSegment9())
                        .ccidSegment10(lineReq.getCcidSegment10())
                        .ccidSegment11(lineReq.getCcidSegment11())
                        .ccidSegment12(lineReq.getCcidSegment12())
                        .createdAt(now)
                        .build();
                lineEntities.add(lineEntity);
            }
            entity.getLines().addAll(lineEntities);
        }

        // 7. Save
        PayOrderEntity saved = payOrderRepository.save(entity);

        // 8. Audit
        String payloadJson = toJson(saved);
        auditHashChainService.record(
                "PAY_ORDER", id, "CREATE",
                user.userId(), ip,
                null, saved.getVersion(),
                payloadJson);

        // 9. Build response
        PayOrderResponse response = mapper.toResponse(saved);

        // 10. Store idempotency result
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.store(idempotencyKey, requestJson, 201, toJson(response));
        }

        log.info("PayOrder created: id={} refNo={} by={}", id, refNo, user.userId());
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
