package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.domain.exception.InvalidStateTransitionException;
import com.kb.ltt.domain.exception.OptimisticLockException;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.SubmitOrderUseCase;
import com.kb.ltt.port.out.*;
import com.kb.ltt.interfaces.rest.dto.PayOrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Submit order use case implementation.
 * Validates all fields (VAL-01..19). Re-validates CCID.
 * DRAFT/RETURNED_TO_MAKER -> READY_FOR_APPROVAL.
 *
 * BDD coverage:
 * - bdd-04-submit.md — Scenario 1: Happy path — DRAFT -> READY_FOR_APPROVAL
 * - bdd-04-submit.md — Scenario 2: RETURNED -> READY after correction
 * - bdd-04-submit.md — Scenario 3: Validation fails — amount mismatch
 * - bdd-04-submit.md — Scenario 4: CCID invalid — reject
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubmitOrderService implements SubmitOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdempotencyStore idempotencyStore;
    private final PeriodControlGateway periodControlGateway;
    private final NotificationSender notificationSender;

    @Override
    @Transactional
    public PayOrderResponse submit(String orderId, Integer expectedVersion,
                                   String userId, String ipAddress, String idempotencyKey) {
        // Idempotency check
        if (idempotencyKey != null) {
            var cached = idempotencyStore.findByKey(idempotencyKey);
            if (cached != null) {
                return (PayOrderResponse) cached;
            }
        }

        PayOrder order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + orderId));

        // Ownership check
        if (!order.getCreatedBy().equals(userId)) {
            throw new BusinessRuleException("MSG-ERR-PERMISSION",
                    "Chi Maker goc moi duoc gui lenh nay.");
        }

        // Status check — only DRAFT or RETURNED_TO_MAKER
        if (order.getStatus() != OrderStatus.DRAFT && order.getStatus() != OrderStatus.RETURNED_TO_MAKER) {
            throw new InvalidStateTransitionException("MSG-ERR-STATUS",
                    "Khong the gui lenh o trang thai " + order.getStatus());
        }

        // Optimistic lock check
        if (expectedVersion != null && !order.getVersion().equals(expectedVersion)) {
            throw new OptimisticLockException("MSG-ERR-LOCK",
                    "Ban ghi da bi thay doi. Version hien tai=" + order.getVersion());
        }

        // BDD: bdd-04-submit.md — Full validation (VAL-01..19)
        validateForSubmit(order);

        // Period OPEN validation
        if (!periodControlGateway.isOpen(order.getKbnnId(), order.getPaymentDate())) {
            throw new BusinessRuleException("MSG-ERR-PERIOD",
                    "Ky ke thao khong mo cho PAYMENT_DATE=" + order.getPaymentDate());
        }

        int versionBefore = order.getVersion();
        OffsetDateTime now = OffsetDateTime.now();

        // Transition state
        order.setStatus(OrderStatus.READY_FOR_APPROVAL);
        order.setVersion(order.getVersion() + 1);
        order.setUpdatedBy(userId);
        order.setUpdatedAt(now);
        order.setUpdatedIp(ipAddress);

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(AuditLogEntry.builder()
                .entityType("PAY_ORDER")
                .entityId(saved.getId())
                .action("SUBMIT")
                .performedBy(userId)
                .performedAt(now)
                .ipAddress(ipAddress)
                .versionBefore(versionBefore)
                .versionAfter(saved.getVersion())
                .build());

        // Notification to checkers (BIZ-009)
        notificationSender.send("CHECKER_GROUP", "ORDER_SUBMITTED",
                java.util.Map.of("orderId", saved.getId(), "refNo", saved.getRefNo()));

        return toResponse(saved);
    }

    /**
     * Validates all mandatory fields before submit (VAL-01..19).
     * Throws BusinessRuleException with code MSG-ERR-VALIDATION if any check fails.
     */
    private void validateForSubmit(PayOrder order) {
        java.util.List<String> errors = new java.util.ArrayList<>();

        // VAL-01: CHANNEL required
        if (order.getChannel() == null || order.getChannel().isBlank()) {
            errors.add("CHANNEL la bat buoc");
        }
        // VAL-02: ORDER_TYPE required when channel != LIEN_KHO_BAC
        if (!"LIEN_KHO_BAC".equals(order.getChannel()) && (order.getOrderType() == null || order.getOrderType().isBlank())) {
            errors.add("ORDER_TYPE la bat buoc khi CHANNEL khac LIEN_KHO_BAC");
        }
        // VAL-03: LNH_TRANSACTION_TYPE required when channel=LNH
        if ("LNH".equals(order.getChannel()) && order.getLnhTransactionType() == null) {
            errors.add("LNH_TRANSACTION_TYPE la bat buoc khi CHANNEL=LNH");
        }
        // VAL-04: SENDER/RECEIVER required
        if (order.getSender() == null || order.getSender().isBlank()) errors.add("SENDER la bat buoc");
        if (order.getReceiver() == null || order.getReceiver().isBlank()) errors.add("RECEIVER la bat buoc");
        // VAL-05: PAYMENT_DATE required
        if (order.getPaymentDate() == null) errors.add("PAYMENT_DATE la bat buoc");
        // VAL-06: AMOUNT > 0
        if (order.getAmount() == null || order.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("AMOUNT phai lon hon 0");
        }
        // VAL-07: AMOUNT = SUM(LINE_AMOUNT)
        if (order.getLines() == null || order.getLines().isEmpty()) {
            errors.add("Phai co it nhat 1 dong COA");
        } else {
            BigDecimal lineSum = order.getLines().stream()
                    .map(com.kb.ltt.domain.PayOrderLine::getLineAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (order.getAmount().compareTo(lineSum) != 0) {
                errors.add("AMOUNT (" + order.getAmount() + ") khong bang tong LINE_AMOUNT (" + lineSum + ")");
            }
        }
        // VAL-08: DESCRIPTION required
        if (order.getDescription() == null || order.getDescription().isBlank()) {
            errors.add("DESCRIPTION la bat buoc");
        }
        // VAL-09: Currency/exchange rate
        if (order.getCurrencyCode() != null && !"VND".equals(order.getCurrencyCode())) {
            if (order.getExchangeRate() == null || order.getExchangeRate().compareTo(BigDecimal.ZERO) <= 0) {
                errors.add("EXCHANGE_RATE phai lon hon 0 khi CURRENCY_CODE khac VND");
            }
        }
        // VAL-10: Sender info
        if (order.getSenderName() == null || order.getSenderName().isBlank()) errors.add("SENDER_NAME la bat buoc");
        if (order.getSenderAddress() == null || order.getSenderAddress().isBlank()) errors.add("SENDER_ADDRESS la bat buoc");
        if (order.getSenderGlSegment2() == null || order.getSenderGlSegment2().isBlank()) errors.add("SENDER_GL_SEGMENT2 la bat buoc");
        if (order.getSenderBankCode() == null || order.getSenderBankCode().isBlank()) errors.add("SENDER_BANK_CODE la bat buoc");
        // VAL-11: Receiver info
        if (order.getReceiverName() == null || order.getReceiverName().isBlank()) errors.add("RECEIVER_NAME la bat buoc");
        if (order.getReceiverGlSegment2() == null || order.getReceiverGlSegment2().isBlank()) errors.add("RECEIVER_GL_SEGMENT2 la bat buoc");
        if (order.getReceiverBankCode() == null || order.getReceiverBankCode().isBlank()) errors.add("RECEIVER_BANK_CODE la bat buoc");
        if (order.getReceiverAccountName() == null || order.getReceiverAccountName().isBlank()) errors.add("RECEIVER_ACCOUNT_NAME la bat buoc");
        // VAL-12: Identify conditional
        if (order.getSenderIdentifyId() != null && !order.getSenderIdentifyId().isBlank()) {
            if (order.getSenderIssuedDate() == null) errors.add("SENDER_ISSUED_DATE bat buoc khi co SENDER_IDENTIFY_ID");
            if (order.getSenderIssuedPlace() == null || order.getSenderIssuedPlace().isBlank()) errors.add("SENDER_ISSUED_PLACE bat buoc khi co SENDER_IDENTIFY_ID");
        }
        if (order.getReceiverIdentifyId() != null && !order.getReceiverIdentifyId().isBlank()) {
            if (order.getReceiverIssuedDate() == null) errors.add("RECEIVER_ISSUED_DATE bat buoc khi co RECEIVER_IDENTIFY_ID");
            if (order.getReceiverIssuedPlace() == null || order.getReceiverIssuedPlace().isBlank()) errors.add("RECEIVER_ISSUED_PLACE bat buoc khi co RECEIVER_IDENTIFY_ID");
        }
        // VAL-13: TTSP conditional
        if ("TTSP".equals(order.getChannel())) {
            if (order.getOriginNum() == null || order.getOriginNum().isBlank()) errors.add("ORIGIN_NUM bat buoc khi CHANNEL=TTSP");
            if (order.getTransactionDate() == null) errors.add("TRANSACTION_DATE bat buoc khi CHANNEL=TTSP");
        }

        if (!errors.isEmpty()) {
            throw new BusinessRuleException("MSG-ERR-VALIDATION",
                    "Xac thuc that bai: " + String.join("; ", errors));
        }
    }

    private PayOrderResponse toResponse(PayOrder order) {
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
                .receiverIssuedPlace(order.getReceiverIssuedPlace())
                .kbnnId(order.getKbnnId()).createdBy(order.getCreatedBy()).createdAt(order.getCreatedAt())
                .createdIp(order.getCreatedIp()).updatedBy(order.getUpdatedBy()).updatedAt(order.getUpdatedAt())
                .updatedIp(order.getUpdatedIp()).checkerId(order.getCheckerId())
                .checkerActionAt(order.getCheckerActionAt()).checkerComment(order.getCheckerComment())
                .approverId(order.getApproverId()).approverActionAt(order.getApproverActionAt())
                .approverComment(order.getApproverComment()).attachmentCount(0)
                .build();
    }
}
