package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.PayOrderLine;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.port.in.CreateOrderUseCase;
import com.kb.ltt.port.in.PayOrderResponse;
import com.kb.ltt.port.out.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Create order: Maker creates DRAFT order.
 * BDD: bdd-01-scenario-01.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CreateOrderService implements CreateOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdempotencyStore idempotencyStore;
    private final RefNoGenerator refNoGenerator;
    private final PeriodControlGateway periodControlGateway;

    @Override
    @Transactional
    public PayOrderResponse create(CreateOrderCommand cmd) {
        // Idempotency check
        if (cmd.idempotencyKey() != null) {
            var cached = idempotencyStore.findByKey(cmd.idempotencyKey());
            if (cached.isPresent()) {
                log.info("Idempotency hit for key={}", cmd.idempotencyKey());
                return null; // Simplified: real impl would deserialize cached.responseBody()
            }
        }

        String kbnnId = cmd.kbnnId() != null ? cmd.kbnnId() : "07101";
        String userId = cmd.userId() != null ? cmd.userId() : "anonymous";

        // Period closed validation
        if (cmd.paymentDate() != null && !periodControlGateway.isOpen(kbnnId, cmd.paymentDate())) {
            throw new BusinessRuleException("MSG-ERR-PERIOD",
                    "Ky ke thao khong mo hoac ngay thanh toan ngoai ky. PAYMENT_DATE=" + cmd.paymentDate());
        }

        // Generate REF_NO
        String refNo = refNoGenerator.generate(kbnnId);

        // Create via domain factory method
        PayOrder order = PayOrder.create(refNo, cmd.channel(), kbnnId,
                userId, cmd.userIp(), cmd.idempotencyKey());

        // Set all fields via updateFields
        order.updateFields(
                cmd.channel(), cmd.orderType(), cmd.lnhTransactionType(),
                cmd.sender(), cmd.receiver(), cmd.paymentDate(), cmd.amount(),
                cmd.currencyCode() != null ? cmd.currencyCode() : "VND", cmd.exchangeRate(),
                cmd.originNum(), cmd.transactionDate(), cmd.expType(),
                cmd.fnCode1(), cmd.fnCode2(), cmd.fnAmount(), cmd.description(),
                cmd.senderName(), cmd.senderAddress(), cmd.senderGlSegment2(),
                cmd.senderNum(), cmd.senderBankCode(), cmd.senderIdentifyId(),
                cmd.senderIssuedDate(), cmd.senderIssuedPlace(), cmd.tpcpCode(),
                cmd.receiverName(), cmd.receiverAddress(), cmd.receiverGlSegment2(),
                cmd.receiverBankCode(), cmd.receiverAccountName(), cmd.receiverIdentifyId(),
                cmd.receiverIssuedDate(), cmd.receiverIssuedPlace()
        );

        // Build lines
        if (cmd.lines() != null && !cmd.lines().isEmpty()) {
            List<PayOrderLine> lines = buildLines(cmd.lines(), order.getId());
            order.replaceLines(lines);
        }

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER", saved.getId(), "CREATE", cmd.userId(),
                OffsetDateTime.now(), cmd.userIp(), null, null,
                null, "{\"refNo\":\"" + saved.getRefNo() + "\",\"amount\":" + saved.getAmount() + "}",
                null, 1,
                null, null
        ));

        // Store idempotency
        if (cmd.idempotencyKey() != null) {
            OffsetDateTime now = OffsetDateTime.now();
            idempotencyStore.store(cmd.idempotencyKey(), new IdempotencyStore.StoredResponse(
                    cmd.idempotencyKey(), cmd.idempotencyKey(), "POST /internal/pay-out-manual",
                    201, saved.getId(), cmd.userId(), now, now.plusHours(24)
            ));
        }

        return PayOrderResponseMapper.toResponse(saved);
    }

    private List<PayOrderLine> buildLines(List<CreateOrderUseCase.LineItem> lineItems, String orderId) {
        List<PayOrderLine> lines = new ArrayList<>();
        for (int i = 0; i < lineItems.size(); i++) {
            CreateOrderUseCase.LineItem li = lineItems.get(i);
            PayOrderLine line = PayOrderLine.builder()
                    .id(UUID.randomUUID().toString())
                    .orderId(orderId)
                    .lineNo(i + 1)
                    .glSegment1(li.glSegment1() != null ? li.glSegment1() : "01")
                    .glSegment2(li.glSegment2())
                    .glSegment3(li.glSegment3())
                    .glSegment4(li.glSegment4())
                    .glSegment5(li.glSegment5() != null ? li.glSegment5() : "000")
                    .glSegment6(li.glSegment6() != null ? li.glSegment6() : "000")
                    .glSegment7(li.glSegment7() != null ? li.glSegment7() : "0000")
                    .glSegment8(li.glSegment8() != null ? li.glSegment8() : "00000")
                    .glSegment9(li.glSegment9() != null ? li.glSegment9() : "00000")
                    .glSegment10(li.glSegment10() != null ? li.glSegment10() : "00")
                    .glSegment11(li.glSegment11() != null ? li.glSegment11() : "0000")
                    .glSegment12(li.glSegment12() != null ? li.glSegment12() : "000")
                    .ccidKey(computeCcidKey(li))
                    .lineDescription(li.lineDescription())
                    .lineAmount(li.lineAmount())
                    .build();
            lines.add(line);
        }
        return lines;
    }

    private String computeCcidKey(CreateOrderUseCase.LineItem li) {
        return String.join("-",
                li.glSegment1() != null ? li.glSegment1() : "01",
                li.glSegment2(),
                li.glSegment3(),
                li.glSegment4() != null ? li.glSegment4() : "",
                li.glSegment5() != null ? li.glSegment5() : "000",
                li.glSegment6() != null ? li.glSegment6() : "000",
                li.glSegment7() != null ? li.glSegment7() : "0000",
                li.glSegment8() != null ? li.glSegment8() : "00000",
                li.glSegment9() != null ? li.glSegment9() : "00000",
                li.glSegment10() != null ? li.glSegment10() : "00",
                li.glSegment11() != null ? li.glSegment11() : "0000",
                li.glSegment12() != null ? li.glSegment12() : "000"
        );
    }
}
