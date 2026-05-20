package com.kb.ltt.interfaces.rest.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Export request DTO matching openapi.yaml ExportRequest schema.
 * Supports XLSX, PDF, CSV formats with optional filters and column selection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportRequest {

    @NotNull(message = "FORMAT is required")
    private String format; // XLSX, PDF, CSV

    private ExportFilters filters;

    private List<String> columns;

    /**
     * Filter criteria matching the list endpoint filter parameters.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExportFilters {
        private List<String> status;
        private String channel;
        private LocalDate paymentDateFrom;
        private LocalDate paymentDateTo;
        private BigDecimal amountFrom;
        private BigDecimal amountTo;
        private String refNo;
        private String createdBy;
        private String kbnnId;
    }
}
