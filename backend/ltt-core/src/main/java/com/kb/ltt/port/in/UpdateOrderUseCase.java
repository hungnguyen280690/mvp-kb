package com.kb.ltt.port.in;

import com.kb.ltt.domain.enums.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Use case: Cap nhat lenh thanh toan (DRAFT / RETURNED_TO_MAKER).
 * BDD: bdd-01-scenario-01 (DRAFT editable), bdd-03-scenario-02 (RETURNED editable).
 */
public interface UpdateOrderUseCase {

    PayOrderResponse update(UpdateOrderCommand command);

    /**
     * Command record cho update order.
     */
    record UpdateOrderCommand(
            String id,
            long expectedVersion,
            OrderChannel channel,
            String orderType,
            LnhTransactionType lnhTransactionType,
            String sender,
            String receiver,
            LocalDate paymentDate,
            BigDecimal amount,
            String currencyCode,
            BigDecimal exchangeRate,
            String originNum,
            LocalDate transactionDate,
            ExpType expType,
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
            List<LineItem> lines,
            String userId,
            String userIp
    ) {}

    /**
     * Line item trong update command.
     */
    record LineItem(
            String glSegment1,
            String glSegment2,
            String glSegment3,
            String glSegment4,
            String glSegment5,
            String glSegment6,
            String glSegment7,
            String glSegment8,
            String glSegment9,
            String glSegment10,
            String glSegment11,
            String glSegment12,
            String lineDescription,
            BigDecimal lineAmount
    ) {}
}
