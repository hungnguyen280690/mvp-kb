package com.kb.ltt.port.out;

import com.kb.ltt.domain.enums.OrderChannel;
import com.kb.ltt.domain.enums.OrderStatus;

import java.time.LocalDate;
import java.util.List;

/**
 * Specification (criteria) cho PayOrder query.
 */
public record PayOrderSpecification(
        List<OrderStatus> statuses,
        OrderChannel channel,
        String orderType,
        String kbnnId,
        String createdBy,
        String keyword,
        LocalDate paymentDateFrom,
        LocalDate paymentDateTo,
        LocalDate createdDateFrom,
        LocalDate createdDateTo
) {}
