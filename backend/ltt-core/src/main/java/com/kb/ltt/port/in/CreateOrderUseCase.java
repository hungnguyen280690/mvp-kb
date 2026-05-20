package com.kb.ltt.port.in;

import com.kb.ltt.domain.enums.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Use case: Tao moi lenh thanh toan (DRAFT).
 * BDD: bdd-01-scenario-01.
 */
public interface CreateOrderUseCase {

    PayOrderResponse create(CreateOrderCommand command);

    /**
     * Command record cho create order.
     */
    record CreateOrderCommand(
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
            // Sender info
            String senderName,
            String senderAddress,
            String senderGlSegment2,
            String senderNum,
            String senderBankCode,
            String senderIdentifyId,
            LocalDate senderIssuedDate,
            String senderIssuedPlace,
            String tpcpCode,
            // Receiver info
            String receiverName,
            String receiverAddress,
            String receiverGlSegment2,
            String receiverBankCode,
            String receiverAccountName,
            String receiverIdentifyId,
            LocalDate receiverIssuedDate,
            String receiverIssuedPlace,
            // Lines
            List<LineItem> lines,
            // Context
            String kbnnId,
            String userId,
            String userIp,
            String idempotencyKey
    ) {}

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
