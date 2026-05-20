package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.PagedResponse;
import com.kb.ltt.application.dto.PayOrderFilter;
import com.kb.ltt.application.dto.PayOrderSummary;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.mapper.PayOrderMapper;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import com.kb.ltt.infrastructure.persistence.specification.PayOrderSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Lists PayOrders with dynamic filtering and pagination.
 * Builds a JPA {@link Specification} from the supplied filter.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ListPayOrderUseCase {

    private final PayOrderRepository payOrderRepository;
    private final PayOrderMapper mapper;

    @Transactional(readOnly = true)
    public PagedResponse<PayOrderSummary> list(PayOrderFilter filter, int page, int size, String sort) {
        Pageable pageable = buildPageable(page, size, sort);
        Specification<PayOrderEntity> spec = buildSpec(filter);

        Page<PayOrderEntity> pageResult = payOrderRepository.findAll(spec, pageable);

        List<PayOrderSummary> content = pageResult.getContent()
                .stream()
                .map(mapper::toSummary)
                .toList();

        return PagedResponse.<PayOrderSummary>builder()
                .content(content)
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Specification<PayOrderEntity> buildSpec(PayOrderFilter filter) {
        Specification<PayOrderEntity> spec = Specification.where(null);

        if (filter == null) {
            return PayOrderSpecification.excludeDeleted();
        }

        spec = spec.and(PayOrderSpecification.byKbnnId(filter.getKbnnId()));
        spec = spec.and(PayOrderSpecification.byStatus(filter.getStatus()));
        spec = spec.and(PayOrderSpecification.byChannel(filter.getChannel()));
        spec = spec.and(PayOrderSpecification.byRefNo(filter.getRefNo()));
        spec = spec.and(PayOrderSpecification.byReceiverName(filter.getReceiverName()));
        spec = spec.and(PayOrderSpecification.byPaymentDateRange(
                filter.getPaymentDateFrom(), filter.getPaymentDateTo()));
        spec = spec.and(PayOrderSpecification.byAmountRange(
                filter.getAmountFrom(), filter.getAmountTo()));
        spec = spec.and(PayOrderSpecification.byCreatedBy(filter.getCreatedBy()));

        if (!filter.isIncludeDeleted()) {
            spec = spec.and(PayOrderSpecification.excludeDeleted());
        }

        return spec;
    }

    /**
     * Parse a sort string like "createdAt,desc" or "paymentDate,asc".
     * Falls back to "createdAt,desc" if null or malformed.
     */
    private Pageable buildPageable(int page, int size, String sort) {
        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            if (parts.length == 2) {
                String property = parts[0].trim();
                String direction = parts[1].trim();
                sortObj = Sort.by(
                        "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC,
                        property);
            } else if (parts.length == 1) {
                sortObj = Sort.by(Sort.Direction.ASC, parts[0].trim());
            }
        }
        return PageRequest.of(page, size, sortObj);
    }
}
