package com.kb.ltt.port.in;

import com.kb.ltt.domain.enums.OrderChannel;
import com.kb.ltt.domain.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Response DTO cho cac use case tra ve PayOrder.
 */
public record PayOrderResponse(
        String id,
        long version,
        OrderStatus status,
        String refNo,
        OrderChannel channel,
        String orderType,
        String lnhTransactionType,
        String sender,
        String receiver,
        LocalDate paymentDate,
        BigDecimal amount,
        String currencyCode,
        BigDecimal exchangeRate,
        String originNum,
        LocalDate transactionDate,
        String expType,
        String fnCode1,
        String fnCode2,
        BigDecimal fnAmount,
        String description,
        String senderName,
        String senderAddress,
        String senderGlSegment2,
        String senderNum,
        String senderBankCode,
        String senderIdentifyId,
        LocalDate senderIssuedDate,
        String senderIssuedPlace,
        String tpcpCode,
        String receiverName,
        String receiverAddress,
        String receiverGlSegment2,
        String receiverBankCode,
        String receiverAccountName,
        String receiverIdentifyId,
        LocalDate receiverIssuedDate,
        String receiverIssuedPlace,
        String kbnnId,
        String createdBy,
        OffsetDateTime createdAt,
        String updatedBy,
        OffsetDateTime updatedAt,
        String checkerId,
        OffsetDateTime checkerActionAt,
        String checkerComment,
        String approverId,
        OffsetDateTime approverActionAt,
        String approverComment,
        String deleteReason,
        String deletedBy,
        OffsetDateTime deletedAt,
        List<PayOrderLineResponse> lines,
        List<PayOrderApprovalResponse> approvals
) {}
