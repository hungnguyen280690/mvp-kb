package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.PayOrderLine;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.PayOrderResponse;
import com.kb.ltt.port.in.UpdateOrderUseCase;
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
 * Update order: DRAFT/RETURNED_TO_MAKER (no status change).
 * BDD: bdd-02-scenario-01 (DRAFT update), bdd-03-scenario-02 (RETURNED update).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UpdateOrderService implements UpdateOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final PeriodControlGateway periodControlGateway;

    @Override
    @Transactional
    public PayOrderResponse update(UpdateOrderCommand cmd) {
        PayOrder order = payOrderRepository.findById(cmd.id())
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + cmd.id()));

        // Period OPEN validation (if payment date changed)
        if (cmd.paymentDate() != null
                && !periodControlGateway.isOpen(order.getKbnnId(), cmd.paymentDate())) {
            throw new BusinessRuleException("MSG-ERR-PERIOD",
                    "Ky ke thao khong mo cho PAYMENT_DATE=" + cmd.paymentDate());
        }

        int versionBefore = (int) order.getVersion();

        // Delegate state guard + optimistic lock to domain
        order.update(cmd.userId(), cmd.userIp(), cmd.expectedVersion());

        // Update fields
        order.updateFields(
                cmd.channel(), cmd.orderType(), cmd.lnhTransactionType(),
                cmd.sender(), cmd.receiver(), cmd.paymentDate(), cmd.amount(),
                cmd.currencyCode(), cmd.exchangeRate(),
                cmd.originNum(), cmd.transactionDate(), cmd.expType(),
                cmd.fnCode1(), cmd.fnCode2(), cmd.fnAmount(), cmd.description(),
                cmd.senderName(), cmd.senderAddress(), cmd.senderGlSegment2(),
                cmd.senderNum(), cmd.senderBankCode(), cmd.senderIdentifyId(),
                cmd.senderIssuedDate(), cmd.senderIssuedPlace(), cmd.tpcpCode(),
                cmd.receiverName(), cmd.receiverAddress(), cmd.receiverGlSegment2(),
                cmd.receiverBankCode(), cmd.receiverAccountName(), cmd.receiverIdentifyId(),
                cmd.receiverIssuedDate(), cmd.receiverIssuedPlace()
        );

        // Replace lines
        if (cmd.lines() != null && !cmd.lines().isEmpty()) {
            List<PayOrderLine> newLines = buildLines(cmd.lines(), cmd.id());
            order.replaceLines(newLines);
        }

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER", saved.getId(), "UPDATE", cmd.userId(),
                OffsetDateTime.now(), cmd.userIp(), null, null,
                null, null,
                versionBefore, (int) saved.getVersion(),
                null, null
        ));

        return PayOrderResponseMapper.toResponse(saved);
    }

    private List<PayOrderLine> buildLines(List<UpdateOrderUseCase.LineItem> lineItems, String orderId) {
        List<PayOrderLine> lines = new ArrayList<>();
        for (int i = 0; i < lineItems.size(); i++) {
            UpdateOrderUseCase.LineItem li = lineItems.get(i);
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

    private String computeCcidKey(UpdateOrderUseCase.LineItem li) {
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
