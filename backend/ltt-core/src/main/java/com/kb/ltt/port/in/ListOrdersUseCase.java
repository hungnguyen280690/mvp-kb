package com.kb.ltt.port.in;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.kb.ltt.domain.enums.OrderStatus;

import java.time.LocalDate;
import java.util.List;

public interface ListOrdersUseCase {

    PageResponse list(ListQuery query);

    record ListQuery(
            List<OrderStatus> statuses,
            String channel,
            String orderType,
            String kbnnId,
            String createdBy,
            String keyword,
            LocalDate paymentDateFrom,
            LocalDate paymentDateTo,
            LocalDate createdDateFrom,
            LocalDate createdDateTo,
            String sortBy,
            String sortDirection,
            int page,
            int size
    ) {}

    record PaginationMeta(
            @JsonProperty("TOTAL_ELEMENTS") long totalElements,
            @JsonProperty("TOTAL_PAGES") int totalPages,
            @JsonProperty("NUMBER") int number,
            @JsonProperty("SIZE") int size
    ) {}

    record PageResponse(
            @JsonProperty("CONTENT") List<PayOrderResponse> content,
            @JsonProperty("PAGE") PaginationMeta page
    ) {}
}
