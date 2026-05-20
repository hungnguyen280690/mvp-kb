package com.kb.ltt.application.usecase;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kb.ltt.application.dto.PayOrderLineRequest;
import com.kb.ltt.application.dto.PayOrderRequest;
import com.kb.ltt.application.dto.PayOrderResponse;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.domain.exception.InvalidStatusTransitionException;
import com.kb.ltt.domain.exception.OptimisticLockException;
import com.kb.ltt.domain.exception.SoDViolationException;
import com.kb.ltt.domain.model.PayOrderStatus;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderLineEntity;
import com.kb.ltt.infrastructure.persistence.mapper.PayOrderMapper;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import com.kb.ltt.infrastructure.service.AuditHashChainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Updates an existing PayOrder.
 * Enforces: editable-status check, SoD (owner only), optimistic locking.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UpdatePayOrderUseCase {

    private static final Set<String> EDITABLE_STATUSES = Set.of("DRAFT", "RETURNED_TO_MAKER");

    private final PayOrderRepository payOrderRepository;
    private final PayOrderMapper mapper;
    private final AuditHashChainService auditHashChainService;
    private final ObjectMapper objectMapper;

    @Transactional
    public PayOrderResponse update(String id,
                                   PayOrderRequest request,
                                   UserContext user,
                                   Long ifMatchVersion,
                                   String idempotencyKey,
                                   String ip) {
        // 1. Find entity
        PayOrderEntity entity = payOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "MSG-ERR-NOT-FOUND", "PayOrder not found: " + id));

        // 2. Check status
        if (!EDITABLE_STATUSES.contains(entity.getStatus())) {
            throw new InvalidStatusTransitionException(
                    PayOrderStatus.valueOf(entity.getStatus()), "UPDATE");
        }

        // 3. SoD: only the original creator can edit
        if (!user.userId().equals(entity.getCreatedBy())) {
            throw new SoDViolationException(
                    "Only the creator may edit a PayOrder. createdBy=" + entity.getCreatedBy());
        }

        // 4. Optimistic lock check
        if (ifMatchVersion != null && !ifMatchVersion.equals(entity.getVersion())) {
            throw new OptimisticLockException(ifMatchVersion, entity.getVersion());
        }

        Long versionBefore = entity.getVersion();

        // 5. Update scalar fields
        entity.setChannel(request.getChannel());
        entity.setOrderType(request.getOrderType());
        entity.setLnhTransactionType(request.getLnhTransactionType());
        entity.setSender(request.getSender());
        entity.setReceiver(request.getReceiver());
        entity.setPaymentDate(request.getPaymentDate());
        entity.setCurrencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "VND");
        entity.setExchangeRate(request.getExchangeRate());
        entity.setOriginNum(request.getOriginNum());
        entity.setTransactionDate(request.getTransactionDate());
        entity.setExpType(request.getExpType());
        entity.setFnCode1(request.getFnCode1());
        entity.setFnCode2(request.getFnCode2());
        entity.setFnAmount(request.getFnAmount());
        entity.setDescription(request.getDescription());
        entity.setSenderName(request.getSenderName());
        entity.setSenderAddress(request.getSenderAddress());
        entity.setSenderGlSegment2(request.getSenderGlSegment2());
        entity.setSenderNum(request.getSenderNum());
        entity.setSenderBankCode(request.getSenderBankCode());
        entity.setSenderIdentifyId(request.getSenderIdentifyId());
        entity.setSenderIssuedDate(request.getSenderIssuedDate());
        entity.setSenderIssuedPlace(request.getSenderIssuedPlace());
        entity.setTpcpCode(request.getTpcpCode());
        entity.setReceiverName(request.getReceiverName());
        entity.setReceiverAddress(request.getReceiverAddress());
        entity.setReceiverGlSegment2(request.getReceiverGlSegment2());
        entity.setReceiverBankCode(request.getReceiverBankCode());
        entity.setReceiverAccountName(request.getReceiverAccountName());
        entity.setReceiverIdentifyId(request.getReceiverIdentifyId());
        entity.setReceiverIssuedDate(request.getReceiverIssuedDate());
        entity.setReceiverIssuedPlace(request.getReceiverIssuedPlace());

        // Update audit fields
        entity.setUpdatedBy(user.userId());
        entity.setUpdatedAt(Instant.now());
        entity.setUpdatedIp(ip);

        // 6. Recompute amount
        BigDecimal amount = BigDecimal.ZERO;
        if (request.getLines() != null) {
            amount = request.getLines().stream()
                    .filter(l -> l.getLineAmount() != null)
                    .map(PayOrderLineRequest::getLineAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        entity.setAmount(amount);

        // 7. Replace lines (orphanRemoval handles deletion)
        entity.getLines().clear();
        if (request.getLines() != null) {
            Instant now = Instant.now();
            List<PayOrderLineEntity> newLines = new ArrayList<>();
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
                        .updatedAt(now)
                        .build();
                newLines.add(lineEntity);
            }
            entity.getLines().addAll(newLines);
        }

        // 8. Save (JPA @Version increments automatically)
        PayOrderEntity saved = payOrderRepository.save(entity);

        // 9. Audit
        auditHashChainService.record(
                "PAY_ORDER", id, "UPDATE",
                user.userId(), ip,
                versionBefore, saved.getVersion(),
                toJson(saved));

        log.info("PayOrder updated: id={} by={}", id, user.userId());
        return mapper.toResponse(saved);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
