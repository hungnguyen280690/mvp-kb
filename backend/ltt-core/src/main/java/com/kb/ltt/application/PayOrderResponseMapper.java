package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.PayOrderApproval;
import com.kb.ltt.domain.PayOrderLine;
import com.kb.ltt.port.in.PayOrderApprovalResponse;
import com.kb.ltt.port.in.PayOrderLineResponse;
import com.kb.ltt.port.in.PayOrderResponse;

import java.util.List;

/**
 * Maps PayOrder domain aggregate to port.in.PayOrderResponse record.
 * Shared by all application services.
 */
final class PayOrderResponseMapper {

    private PayOrderResponseMapper() {}

    static PayOrderResponse toResponse(PayOrder order) {
        return new PayOrderResponse(
                order.getId(),
                order.getVersion(),
                order.getStatus(),
                order.getRefNo(),
                order.getChannel(),
                order.getOrderType(),
                order.getLnhTransactionType() != null ? order.getLnhTransactionType().name() : null,
                order.getSender(),
                order.getReceiver(),
                order.getPaymentDate(),
                order.getAmount(),
                order.getCurrencyCode(),
                order.getExchangeRate(),
                order.getOriginNum(),
                order.getTransactionDate(),
                order.getExpType() != null ? order.getExpType().name() : null,
                order.getFnCode1(),
                order.getFnCode2(),
                order.getFnAmount(),
                order.getDescription(),
                order.getSenderName(),
                order.getSenderAddress(),
                order.getSenderGlSegment2(),
                order.getSenderNum(),
                order.getSenderBankCode(),
                order.getSenderIdentifyId(),
                order.getSenderIssuedDate(),
                order.getSenderIssuedPlace(),
                order.getTpcpCode(),
                order.getReceiverName(),
                order.getReceiverAddress(),
                order.getReceiverGlSegment2(),
                order.getReceiverBankCode(),
                order.getReceiverAccountName(),
                order.getReceiverIdentifyId(),
                order.getReceiverIssuedDate(),
                order.getReceiverIssuedPlace(),
                order.getKbnnId(),
                order.getCreatedBy(),
                order.getCreatedAt(),
                order.getUpdatedBy(),
                order.getUpdatedAt(),
                order.getCheckerId(),
                order.getCheckerActionAt(),
                order.getCheckerComment(),
                order.getApproverId(),
                order.getApproverActionAt(),
                order.getApproverComment(),
                order.getDeleteReason(),
                order.getDeletedBy(),
                order.getDeletedAt(),
                mapLines(order.getLines()),
                mapApprovals(order.getApprovals())
        );
    }

    private static List<PayOrderLineResponse> mapLines(List<PayOrderLine> lines) {
        if (lines == null) return List.of();
        return lines.stream().map(l -> new PayOrderLineResponse(
                l.getId(), l.getLineNo(),
                l.getGlSegment1(), l.getGlSegment2(), l.getGlSegment3(), l.getGlSegment4(),
                l.getGlSegment5(), l.getGlSegment6(), l.getGlSegment7(), l.getGlSegment8(),
                l.getGlSegment9(), l.getGlSegment10(), l.getGlSegment11(), l.getGlSegment12(),
                l.getCcidKey(), l.getLineDescription(), l.getLineAmount()
        )).toList();
    }

    private static List<PayOrderApprovalResponse> mapApprovals(List<PayOrderApproval> approvals) {
        if (approvals == null) return List.of();
        return approvals.stream().map(a -> new PayOrderApprovalResponse(
                a.getId(), a.getStepNo(),
                a.getAction() != null ? a.getAction().name() : null,
                a.getFromStatus(), a.getToStatus(),
                a.getPerformedBy(),
                a.getPerformedRole() != null ? a.getPerformedRole().name() : null,
                a.getPerformedAt(),
                a.getReason(),
                a.getVersionBefore(),
                a.getVersionAfter()
        )).toList();
    }
}
