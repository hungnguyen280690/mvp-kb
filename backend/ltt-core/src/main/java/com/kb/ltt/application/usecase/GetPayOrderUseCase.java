package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.PayOrderResponse;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.mapper.PayOrderMapper;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Retrieves a single PayOrder by ID.
 * The caller (controller) is responsible for setting ETag headers from {@code response.getVersion()}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GetPayOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final PayOrderMapper mapper;

    @Transactional(readOnly = true)
    public PayOrderResponse getById(String id) {
        PayOrderEntity entity = payOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "MSG-ERR-NOT-FOUND",
                        "PayOrder not found: " + id));
        return mapper.toResponse(entity);
    }
}
