package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.enums.OrderChannel;
import com.kb.ltt.port.in.ListOrdersUseCase;
import com.kb.ltt.port.in.PayOrderResponse;
import com.kb.ltt.port.out.PayOrderRepository;
import com.kb.ltt.port.out.PayOrderSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * List orders with filter, sort, pagination.
 * BDD: bdd-04-list.md.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ListOrdersService implements ListOrdersUseCase {

    private final PayOrderRepository payOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse list(ListQuery query) {
        PayOrderSpecification spec = new PayOrderSpecification(
                query.statuses(),
                query.channel() != null ? OrderChannel.valueOf(query.channel()) : null,
                query.orderType(),
                query.kbnnId(),
                query.createdBy(),
                query.keyword(),
                query.paymentDateFrom(),
                query.paymentDateTo(),
                query.createdDateFrom(),
                query.createdDateTo()
        );

        String sortBy = query.sortBy() != null ? query.sortBy() : "createdAt";
        String sortDir = query.sortDirection() != null ? query.sortDirection() : "DESC";

        PayOrderRepository.PayOrderPage page = payOrderRepository.findAll(
                spec, query.page(), query.size(), sortBy, sortDir);

        List<PayOrderResponse> content = page.content().stream()
                .map(PayOrderResponseMapper::toResponse)
                .toList();

        return new PageResponse(
                content,
                new PaginationMeta(
                        page.totalElements(),
                        page.totalPages(),
                        page.page(),
                        page.size()
                )
        );
    }
}
