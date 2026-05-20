package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.port.in.GetOrderUseCase;
import com.kb.ltt.port.in.PayOrderResponse;
import com.kb.ltt.port.out.PayOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetOrderService implements GetOrderUseCase {

    private final PayOrderRepository payOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public PayOrderResponse getById(String id) {
        PayOrder order = payOrderRepository.findById(id)
                .orElseThrow(() -> new com.kb.ltt.domain.exception.ResourceNotFoundException("PayOrder", id));
        return PayOrderResponseMapper.toResponse(order);
    }
}
