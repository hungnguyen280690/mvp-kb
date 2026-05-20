package com.kb.ltt.interfaces.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.List;

/**
 * Paginated list response matching openapi.yaml PayOrderListResponse schema.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayOrderListResponse {

    private List<PayOrderListItem> content;
    private PaginationMeta page;

    /**
     * Summary item for list views matching openapi.yaml PayOrderListItem schema.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayOrderListItem {
        private String id;
        private Integer version;
        private String status;
        private String refNo;
        private String channel;
        private String orderType;
        private String sender;
        private String receiver;
        private LocalDate paymentDate;
        private BigDecimal amount;
        private String currencyCode;
        private String description;
        private String kbnnId;
        private String createdBy;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
        private String checkerId;
        private String approverId;
        private String senderName;
        private String receiverName;
        private Integer attachmentCount;
    }

    /**
     * Pagination metadata matching openapi.yaml PaginationMeta schema.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginationMeta {
        private Long totalElements;
        private Integer totalPages;
        private Integer number;
        private Integer size;
    }
}
