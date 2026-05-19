package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.PayOrderLine;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.CopyOrderUseCase;
import com.kb.ltt.port.out.*;
import com.kb.ltt.interfaces.rest.dto.PayOrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Copy (clone) order use case implementation.
 * Clone existing order into a new DRAFT with new REF_NO and new ID.
 *
 * BDD coverage:
 * - bdd-01-create.md — Scenario 5: Copy from existing order — happy path
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CopyOrderService implements CopyOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdempotencyStore idempotencyStore;
    private final RefNoGenerator refNoGenerator;

    @Override
    @Transactional
    public PayOrderResponse copy(String sourceOrderId, String userId, String kbnnId,
                                  String ipAddress, String idempotencyKey) {
        // Idempotency check
        if (idempotencyKey != null) {
            var cached = idempotencyStore.findByKey(idempotencyKey);
            if (cached != null) {
                return (PayOrderResponse) cached;
            }
        }

        PayOrder source = payOrderRepository.findById(sourceOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan nguon voi id=" + sourceOrderId));

        // Generate new ID and REF_NO
        String newId = UUID.randomUUID().toString();
        String newRefNo = refNoGenerator.generate(kbnnId);
        OffsetDateTime now = OffsetDateTime.now();

        // Clone lines with new IDs
        List<PayOrderLine> clonedLines = new ArrayList<>();
        if (source.getLines() != null) {
            for (PayOrderLine srcLine : source.getLines()) {
                PayOrderLine cloned = PayOrderLine.builder()
                        .id(UUID.randomUUID().toString())
                        .orderId(newId)
                        .lineNo(srcLine.getLineNo())
                        .glSegment1(srcLine.getGlSegment1())
                        .glSegment2(srcLine.getGlSegment2())
                        .glSegment3(srcLine.getGlSegment3())
                        .glSegment4(srcLine.getGlSegment4())
                        .glSegment5(srcLine.getGlSegment5())
                        .glSegment6(srcLine.getGlSegment6())
                        .glSegment7(srcLine.getGlSegment7())
                        .glSegment8(srcLine.getGlSegment8())
                        .glSegment9(srcLine.getGlSegment9())
                        .glSegment10(srcLine.getGlSegment10())
                        .glSegment11(srcLine.getGlSegment11())
                        .glSegment12(srcLine.getGlSegment12())
                        .ccidKey(srcLine.getCcidKey())
                        .lineDescription(srcLine.getLineDescription())
                        .lineAmount(srcLine.getLineAmount())
                        .createdAt(now)
                        .build();
                clonedLines.add(cloned);
            }
        }

        PayOrder newOrder = PayOrder.builder()
                .id(newId)
                .version(1)
                .status(OrderStatus.DRAFT)
                .refNo(newRefNo)
                .channel(source.getChannel())
                .orderType(source.getOrderType())
                .lnhTransactionType(source.getLnhTransactionType())
                .sender(source.getSender())
                .receiver(source.getReceiver())
                .paymentDate(source.getPaymentDate())
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
                .kbnnId(kbnnId)
                .createdBy(userId)
                .createdAt(now)
                .createdIp(ipAddress)
                .lines(clonedLines)
                .build();

        PayOrder saved = payOrderRepository.save(newOrder);

        // Audit log
        auditLogRepository.save(AuditLogEntry.builder()
                .entityType("PAY_ORDER")
                .entityId(saved.getId())
                .action("CREATE")
                .performedBy(userId)
                .performedAt(now)
                .ipAddress(ipAddress)
                .versionBefore(null)
                .versionAfter(1)
                .newValue("{\"copiedFrom\":\"" + sourceOrderId + "\",\"refNo\":\"" + saved.getRefNo() + "\"}")
                .build());

        return toResponse(saved);
    }

    private PayOrderResponse toResponse(PayOrder order) {
        List<PayOrderResponse.PayOrderLineResponse> lineResponses = new ArrayList<>();
        if (order.getLines() != null) {
            for (PayOrderLine l : order.getLines()) {
                lineResponses.add(PayOrderResponse.PayOrderLineResponse.builder()
                        .id(l.getId()).orderId(l.getOrderId()).lineNo(l.getLineNo())
                        .glSegment1(l.getGlSegment1()).glSegment2(l.getGlSegment2())
                        .glSegment3(l.getGlSegment3()).glSegment4(l.getGlSegment4())
                        .glSegment5(l.getGlSegment5()).glSegment6(l.getGlSegment6())
                        .glSegment7(l.getGlSegment7()).glSegment8(l.getGlSegment8())
                        .glSegment9(l.getGlSegment9()).glSegment10(l.getGlSegment10())
                        .glSegment11(l.getGlSegment11()).glSegment12(l.getGlSegment12())
                        .ccidKey(l.getCcidKey()).lineDescription(l.getLineDescription())
                        .lineAmount(l.getLineAmount()).createdAt(l.getCreatedAt()).updatedAt(l.getUpdatedAt())
                        .build());
            }
        }
        return PayOrderResponse.builder()
                .id(order.getId()).version(order.getVersion()).status(order.getStatus().name())
                .refNo(order.getRefNo()).channel(order.getChannel()).orderType(order.getOrderType())
                .lnhTransactionType(order.getLnhTransactionType()).sender(order.getSender())
                .receiver(order.getReceiver()).paymentDate(order.getPaymentDate()).amount(order.getAmount())
                .currencyCode(order.getCurrencyCode()).exchangeRate(order.getExchangeRate())
                .originNum(order.getOriginNum()).transactionDate(order.getTransactionDate())
                .expType(order.getExpType()).fnCode1(order.getFnCode1()).fnCode2(order.getFnCode2())
                .fnAmount(order.getFnAmount()).description(order.getDescription())
                .senderName(order.getSenderName()).senderAddress(order.getSenderAddress())
                .senderGlSegment2(order.getSenderGlSegment2()).senderNum(order.getSenderNum())
                .senderBankCode(order.getSenderBankCode()).senderIdentifyId(order.getSenderIdentifyId())
                .senderIssuedDate(order.getSenderIssuedDate()).senderIssuedPlace(order.getSenderIssuedPlace())
                .tpcpCode(order.getTpcpCode()).receiverName(order.getReceiverName())
                .receiverAddress(order.getReceiverAddress()).receiverGlSegment2(order.getReceiverGlSegment2())
                .receiverBankCode(order.getReceiverBankCode()).receiverAccountName(order.getReceiverAccountName())
                .receiverIdentifyId(order.getReceiverIdentifyId()).receiverIssuedDate(order.getReceiverIssuedDate())
                .receiverIssuedPlace(order.getReceiverIssuedPlace()).lines(lineResponses)
                .kbnnId(order.getKbnnId()).createdBy(order.getCreatedBy()).createdAt(order.getCreatedAt())
                .createdIp(order.getCreatedIp()).updatedBy(order.getUpdatedBy()).updatedAt(order.getUpdatedAt())
                .updatedIp(order.getUpdatedIp()).checkerId(order.getCheckerId())
                .checkerActionAt(order.getCheckerActionAt()).checkerComment(order.getCheckerComment())
                .approverId(order.getApproverId()).approverActionAt(order.getApproverActionAt())
                .approverComment(order.getApproverComment()).attachmentCount(0)
                .build();
    }
}
