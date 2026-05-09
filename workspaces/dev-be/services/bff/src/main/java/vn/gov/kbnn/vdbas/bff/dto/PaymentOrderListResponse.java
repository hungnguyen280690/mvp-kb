package vn.gov.kbnn.vdbas.bff.dto;

import lombok.Data;

import java.util.List;

@Data
public class PaymentOrderListResponse {
    private List<PaymentOrderSummaryDto> content;
    private PageInfo page;

    @Data
    public static class PageInfo {
        private int number;
        private int size;
        private long totalElements;
        private int totalPages;
    }
}
