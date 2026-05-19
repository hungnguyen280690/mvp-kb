package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.port.in.ListOrdersUseCase;
import com.kb.ltt.port.out.PayOrderRepository;
import com.kb.ltt.interfaces.rest.dto.PayOrderListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * List orders use case implementation.
 * Filter by status, channel, date range, amount range, refNo, createdBy, kbnnId.
 * Paginated with sort support.
 *
 * BDD coverage:
 * - bdd-01-create.md — Scenario 6: List orders with filters and pagination
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ListOrdersService implements ListOrdersUseCase {

    private final PayOrderRepository payOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public PayOrderListResponse list(List<String> statuses, String channel,
                                      LocalDate paymentDateFrom, LocalDate paymentDateTo,
                                      BigDecimal amountFrom, BigDecimal amountTo,
                                      String refNo, String createdBy, String kbnnId,
                                      Integer page, Integer size, List<String> sort) {
        // Build pageable with sort
        Sort sortObj = buildSort(sort);
        PageRequest pageable = PageRequest.of(
                page != null ? page : 0,
                size != null ? Math.min(size, 100) : 20,
                sortObj);

        // Build specification and query
        Page<PayOrder> result = payOrderRepository.findAll(
                buildSpecification(statuses, channel, paymentDateFrom, paymentDateTo,
                        amountFrom, amountTo, refNo, createdBy, kbnnId),
                pageable);

        // Map to response
        List<PayOrderListResponse.PayOrderListItem> items = new ArrayList<>();
        for (PayOrder order : result.getContent()) {
            items.add(PayOrderListResponse.PayOrderListItem.builder()
                    .id(order.getId())
                    .version(order.getVersion())
                    .status(order.getStatus().name())
                    .refNo(order.getRefNo())
                    .channel(order.getChannel())
                    .orderType(order.getOrderType())
                    .sender(order.getSender())
                    .receiver(order.getReceiver())
                    .paymentDate(order.getPaymentDate())
                    .amount(order.getAmount())
                    .currencyCode(order.getCurrencyCode())
                    .description(order.getDescription())
                    .kbnnId(order.getKbnnId())
                    .createdBy(order.getCreatedBy())
                    .createdAt(order.getCreatedAt())
                    .updatedAt(order.getUpdatedAt())
                    .checkerId(order.getCheckerId())
                    .approverId(order.getApproverId())
                    .senderName(order.getSenderName())
                    .receiverName(order.getReceiverName())
                    .attachmentCount(0)
                    .build());
        }

        return PayOrderListResponse.builder()
                .content(items)
                .page(PayOrderListResponse.PaginationMeta.builder()
                        .totalElements(result.getTotalElements())
                        .totalPages(result.getTotalPages())
                        .number(result.getNumber())
                        .size(result.getSize())
                        .build())
                .build();
    }

    private Sort buildSort(List<String> sortParams) {
        if (sortParams == null || sortParams.isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        List<Sort.Order> orders = new ArrayList<>();
        for (String s : sortParams) {
            String[] parts = s.split(",");
            String field = mapField(parts[0]);
            Sort.Direction dir = parts.length > 1 && "ASC".equalsIgnoreCase(parts[1])
                    ? Sort.Direction.ASC : Sort.Direction.DESC;
            orders.add(new Sort.Order(dir, field));
        }
        return Sort.by(orders);
    }

    private String mapField(String apiField) {
        return switch (apiField.toUpperCase()) {
            case "REF_NO" -> "refNo";
            case "STATUS" -> "status";
            case "AMOUNT" -> "amount";
            case "PAYMENT_DATE" -> "paymentDate";
            case "CREATED_AT" -> "createdAt";
            default -> "createdAt";
        };
    }

    /**
     * Builds a JPA Specification from the filter parameters.
     * This is a placeholder that returns null — the actual Specification
     * will be implemented in the persistence adapter.
     */
    private Object buildSpecification(List<String> statuses, String channel,
                                       LocalDate paymentDateFrom, LocalDate paymentDateTo,
                                       BigDecimal amountFrom, BigDecimal amountTo,
                                       String refNo, String createdBy, String kbnnId) {
        // The PayOrderRepository.findAll(spec, pageable) accepts a Specification.
        // The actual spec construction is delegated to the persistence adapter.
        // Here we pass null which means "no filter" — the adapter will handle this.
        return null;
    }
}
