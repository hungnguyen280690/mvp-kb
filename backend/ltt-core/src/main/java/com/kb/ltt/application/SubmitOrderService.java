package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.enums.OrderChannel;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.port.in.PayOrderResponse;
import com.kb.ltt.port.in.SubmitOrderUseCase;
import com.kb.ltt.port.out.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Submit order: DRAFT/RETURNED_TO_MAKER -> READY_FOR_APPROVAL.
 * BDD: bdd-02-scenario-01 (DRAFT submit), bdd-03-scenario-03 (RETURNED resubmit).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubmitOrderService implements SubmitOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final PeriodControlGateway periodControlGateway;
    private final NotificationSender notificationSender;

    @Override
    @Transactional
    public PayOrderResponse submit(SubmitCommand cmd) {
        String userId = cmd.userId() != null ? cmd.userId() : "anonymous";

        PayOrder order = payOrderRepository.findById(cmd.id())
                .orElseThrow(() -> new ResourceNotFoundException("MSG-ERR-NOTFOUND",
                        "Khong tim thay lenh thanh toan voi id=" + cmd.id()));

        // Period OPEN validation
        if (order.getPaymentDate() != null
                && !periodControlGateway.isOpen(order.getKbnnId(), order.getPaymentDate())) {
            throw new BusinessRuleException("MSG-ERR-PERIOD",
                    "Ky ke thao khong mo cho PAYMENT_DATE=" + order.getPaymentDate());
        }

        // Validate for submit (VAL-01..19)
        validateForSubmit(order);

        int versionBefore = (int) order.getVersion();

        // Delegate state transition to domain
        order.submit(userId, cmd.userIp(), cmd.expectedVersion());

        PayOrder saved = payOrderRepository.save(order);

        // Audit log
        auditLogRepository.save(new AuditLogRepository.AuditLogEntry(
                "PAY_ORDER", saved.getId(), "SUBMIT", userId,
                OffsetDateTime.now(), cmd.userIp(), null, null,
                null, null,
                versionBefore, (int) saved.getVersion(),
                null, null
        ));

        // Notify checkers
        notificationSender.send("CHECKER_GROUP", "ORDER_SUBMITTED",
                Map.of("orderId", saved.getId(), "refNo", saved.getRefNo()));

        return PayOrderResponseMapper.toResponse(saved);
    }

    private void validateForSubmit(PayOrder order) {
        java.util.List<String> errors = new java.util.ArrayList<>();

        if (order.getChannel() == null) errors.add("CHANNEL la bat buoc");
        if (order.getChannel() != OrderChannel.LIEN_KHO_BAC
                && (order.getOrderType() == null || order.getOrderType().isBlank()))
            errors.add("ORDER_TYPE la bat buoc khi CHANNEL khac LIEN_KHO_BAC");
        if (order.getSender() == null || order.getSender().isBlank()) errors.add("SENDER la bat buoc");
        if (order.getReceiver() == null || order.getReceiver().isBlank()) errors.add("RECEIVER la bat buoc");
        if (order.getPaymentDate() == null) errors.add("PAYMENT_DATE la bat buoc");
        if (order.getAmount() == null || order.getAmount().compareTo(BigDecimal.ZERO) <= 0)
            errors.add("AMOUNT phai lon hon 0");
        if (order.getLines() == null || order.getLines().isEmpty())
            errors.add("Phai co it nhat 1 dong COA");
        else {
            BigDecimal lineSum = order.getLines().stream()
                    .map(com.kb.ltt.domain.PayOrderLine::getLineAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (order.getAmount().compareTo(lineSum) != 0)
                errors.add("AMOUNT (" + order.getAmount() + ") khong bang tong LINE_AMOUNT (" + lineSum + ")");
        }
        if (order.getDescription() == null || order.getDescription().isBlank())
            errors.add("DESCRIPTION la bat buoc");
        if (order.getSenderName() == null || order.getSenderName().isBlank())
            errors.add("SENDER_NAME la bat buoc");
        if (order.getSenderAddress() == null || order.getSenderAddress().isBlank())
            errors.add("SENDER_ADDRESS la bat buoc");
        if (order.getSenderGlSegment2() == null || order.getSenderGlSegment2().isBlank())
            errors.add("SENDER_GL_SEGMENT2 la bat buoc");
        if (order.getSenderBankCode() == null || order.getSenderBankCode().isBlank())
            errors.add("SENDER_BANK_CODE la bat buoc");
        if (order.getReceiverName() == null || order.getReceiverName().isBlank())
            errors.add("RECEIVER_NAME la bat buoc");
        if (order.getReceiverGlSegment2() == null || order.getReceiverGlSegment2().isBlank())
            errors.add("RECEIVER_GL_SEGMENT2 la bat buoc");
        if (order.getReceiverBankCode() == null || order.getReceiverBankCode().isBlank())
            errors.add("RECEIVER_BANK_CODE la bat buoc");
        if (order.getReceiverAccountName() == null || order.getReceiverAccountName().isBlank())
            errors.add("RECEIVER_ACCOUNT_NAME la bat buoc");

        if (!errors.isEmpty()) {
            throw new BusinessRuleException("MSG-ERR-VALIDATION",
                    "Xac thuc that bai: " + String.join("; ", errors));
        }
    }
}
