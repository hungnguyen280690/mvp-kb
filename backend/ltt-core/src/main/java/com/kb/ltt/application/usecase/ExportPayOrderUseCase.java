package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.PayOrderFilter;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import com.kb.ltt.infrastructure.persistence.specification.PayOrderSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Exports PayOrders to EXCEL, CSV, or PDF (MVP placeholder).
 * <p>
 * Export limit: 50,000 records (ADR-0008).
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExportPayOrderUseCase {

    private static final int EXPORT_LIMIT = 50_000;

    private static final String[] HEADERS = {
            "Mã CT", "Kênh", "Ngày TT", "Số tiền", "Đơn vị chuyển",
            "Đơn vị nhận", "Nội dung", "Trạng thái", "Người lập", "Ngày tạo"
    };

    private final PayOrderRepository payOrderRepository;

    /**
     * Export request.
     *
     * @param format "EXCEL" | "CSV" | "PDF"
     * @param filter dynamic filter (same as list endpoint)
     */
    public record ExportRequest(String format, PayOrderFilter filter) {}

    @Transactional(readOnly = true)
    public byte[] export(ExportRequest req, UserContext user) {
        // Build spec from filter
        Specification<PayOrderEntity> spec = buildSpec(req.filter());

        // Fetch ALL matching records (no pagination)
        List<PayOrderEntity> records = payOrderRepository.findAll(spec);

        if (records.size() > EXPORT_LIMIT) {
            throw new BusinessException(
                    "MSG-ERR-EXPORT-LIMIT",
                    "Số bản ghi vượt quá giới hạn cho phép (50,000).");
        }

        log.info("Exporting {} PayOrder records in format={} by user={}", records.size(), req.format(), user.userId());

        String format = req.format() != null ? req.format().toUpperCase() : "CSV";
        return switch (format) {
            case "EXCEL" -> exportExcel(records);
            case "CSV"   -> exportCsv(records);
            case "PDF"   -> "PDF export not fully implemented".getBytes(StandardCharsets.UTF_8);
            default      -> throw new BusinessException("MSG-ERR-EXPORT-FORMAT",
                                                        "Định dạng xuất không hợp lệ: " + req.format());
        };
    }

    // ── EXCEL ─────────────────────────────────────────────────────────────

    private byte[] exportExcel(List<PayOrderEntity> records) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("PAY.OUT.MANUAL");

            // Header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                headerRow.createCell(i).setCellValue(HEADERS[i]);
            }

            // Data rows
            int rowIdx = 1;
            for (PayOrderEntity e : records) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(nullSafe(e.getRefNo()));
                row.createCell(1).setCellValue(nullSafe(e.getChannel()));
                row.createCell(2).setCellValue(e.getPaymentDate() != null ? e.getPaymentDate().toString() : "");
                row.createCell(3).setCellValue(e.getAmount() != null ? e.getAmount().toPlainString() : "");
                row.createCell(4).setCellValue(nullSafe(e.getSender()));
                row.createCell(5).setCellValue(nullSafe(e.getReceiver()));
                row.createCell(6).setCellValue(nullSafe(e.getDescription()));
                row.createCell(7).setCellValue(nullSafe(e.getStatus()));
                row.createCell(8).setCellValue(nullSafe(e.getCreatedBy()));
                row.createCell(9).setCellValue(e.getCreatedAt() != null ? e.getCreatedAt().toString() : "");
            }

            workbook.write(baos);
            return baos.toByteArray();
        } catch (IOException ex) {
            throw new BusinessException("MSG-ERR-EXPORT", "Lỗi tạo file Excel: " + ex.getMessage(), ex);
        }
    }

    // ── CSV ──────────────────────────────────────────────────────────────

    private byte[] exportCsv(List<PayOrderEntity> records) {
        StringBuilder sb = new StringBuilder();

        // BOM for Excel UTF-8 compatibility
        sb.append('﻿');

        // Header
        sb.append(String.join(",", HEADERS)).append("\n");

        // Data
        for (PayOrderEntity e : records) {
            sb.append(csvEscape(e.getRefNo())).append(",");
            sb.append(csvEscape(e.getChannel())).append(",");
            sb.append(e.getPaymentDate() != null ? e.getPaymentDate().toString() : "").append(",");
            sb.append(e.getAmount() != null ? e.getAmount().toPlainString() : "").append(",");
            sb.append(csvEscape(e.getSender())).append(",");
            sb.append(csvEscape(e.getReceiver())).append(",");
            sb.append(csvEscape(e.getDescription())).append(",");
            sb.append(csvEscape(e.getStatus())).append(",");
            sb.append(csvEscape(e.getCreatedBy())).append(",");
            sb.append(e.getCreatedAt() != null ? e.getCreatedAt().toString() : "").append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

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

    private String nullSafe(String value) {
        return value != null ? value : "";
    }

    private String csvEscape(String value) {
        if (value == null) return "";
        // Wrap in quotes if contains comma, quote, or newline
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
