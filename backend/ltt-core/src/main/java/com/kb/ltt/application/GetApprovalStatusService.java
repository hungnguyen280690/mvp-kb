package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.PayOrderApproval;
import com.kb.ltt.port.in.GetApprovalStatusUseCase;
import com.kb.ltt.port.out.PayOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetApprovalStatusService implements GetApprovalStatusUseCase {

    private final PayOrderRepository payOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public ApprovalStatusResponse getApprovalStatus(String orderId) {
        PayOrder order = payOrderRepository.findById(orderId)
                .orElseThrow(() -> new com.kb.ltt.domain.exception.ResourceNotFoundException("PayOrder", orderId));

        List<ApprovalStep> steps = order.getApprovals() != null
                ? order.getApprovals().stream().map(this::toStep).toList()
                : List.of();

        return new ApprovalStatusResponse(orderId, order.getStatus().name(), steps);
    }

    private ApprovalStep toStep(PayOrderApproval a) {
        return new ApprovalStep(
                a.getStepNo(),
                a.getAction() != null ? a.getAction().name() : null,
                a.getFromStatus() != null ? a.getFromStatus().name() : null,
                a.getToStatus() != null ? a.getToStatus().name() : null,
                a.getPerformedBy(),
                a.getPerformedRole() != null ? a.getPerformedRole().name() : null,
                a.getPerformedAt(),
                null,
                a.getReason(),
                a.getVersionBefore() != null ? a.getVersionBefore().intValue() : null,
                a.getVersionAfter() != null ? a.getVersionAfter().intValue() : null
        );
    }
}
