package com.kb.ltt.port.in;

import com.kb.ltt.domain.enums.OrderStatus;

import java.time.LocalDate;
import java.util.List;

/**
 * Use case: Export danh sach lenh thanh toan (Excel/PDF/CSV).
 */
public interface ExportOrdersUseCase {

    byte[] export(ExportQuery query);

    /**
     * Query parameters cho export.
     */
    record ExportQuery(
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
            String format           // XLSX, PDF, CSV
    ) {}
}
