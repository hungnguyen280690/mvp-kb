package com.kb.ltt.port.in;

import com.kb.ltt.domain.enums.OrderStatus;

import java.time.LocalDate;
import java.util.List;

/**
 * Use case: Danh sach lenh thanh toan (loc + sort + phan trang).
 */
public interface ListOrdersUseCase {

    PageResponse list(ListQuery query);

    /**
     * Query parameters cho listing.
     */
    record ListQuery(
            List<OrderStatus> statuses,
            String channel,
            String orderType,
            String kbnnId,
            String createdBy,
            String keyword,          // Search trong refNo, description, senderName, receiverName
            LocalDate paymentDateFrom,
            LocalDate paymentDateTo,
            LocalDate createdDateFrom,
            LocalDate createdDateTo,
            String sortBy,            // Default: createdAt
            String sortDirection,     // ASC/DESC, default: DESC
            int page,                 // 0-based
            int size                  // Default: 20, max: 100
    ) {}

    /**
     * Phan trang response.
     */
    record PageResponse(
            List<PayOrderResponse> content,
            long totalElements,
            int totalPages,
            int page,
            int size
    ) {}
}
