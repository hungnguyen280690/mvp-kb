package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.port.in.ExportOrdersUseCase;
import com.kb.ltt.port.out.PayOrderRepository;
import com.kb.ltt.interfaces.rest.dto.ExportRequest;
import com.opencsv.CSVWriter;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Export orders use case implementation.
 * Supports Excel (Apache POI), PDF (OpenPDF), CSV (OpenCSV). Max 50k records.
 *
 * BDD coverage:
 * - bdd-01-create.md — Scenario 7: Export orders to XLSX/PDF/CSV
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExportOrdersService implements ExportOrdersUseCase {

    private static final int MAX_EXPORT_ROWS = 50_000;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PayOrderRepository payOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public byte[] export(ExportRequest request) {
        String format = request.getFormat();
        if (format == null || (!format.equals("XLSX") && !format.equals("PDF") && !format.equals("CSV"))) {
            throw new BusinessRuleException("MSG-ERR-VALIDATION", "FORMAT khong hop le. Chi ho tro XLSX, PDF, CSV.");
        }

        // Fetch data with a large page (max 50k)
        Page<PayOrder> data = fetchExportData(request);

        if (data.getTotalElements() > MAX_EXPORT_ROWS) {
            throw new BusinessRuleException("MSG-ERR-EXPORT",
                    "So luong ban ghi vuot qua gioi han 50,000. Hien tai: " + data.getTotalElements());
        }

        List<PayOrder> orders = data.getContent();
        List<String> columns = request.getColumns() != null && !request.getColumns().isEmpty()
                ? request.getColumns()
                : getDefaultColumns();

        return switch (format) {
            case "XLSX" -> exportExcel(orders, columns);
            case "PDF" -> exportPdf(orders, columns);
            case "CSV" -> exportCsv(orders, columns);
            default -> throw new BusinessRuleException("MSG-ERR-VALIDATION", "FORMAT khong ho tro: " + format);
        };
    }

    private Page<PayOrder> fetchExportData(ExportRequest request) {
        // Fetch all matching records in one page for export
        PageRequest pageable = PageRequest.of(0, MAX_EXPORT_ROWS, Sort.by(Sort.Direction.DESC, "createdAt"));
        return payOrderRepository.findAll(null, pageable);
    }

    private byte[] exportExcel(List<PayOrder> orders, List<String> columns) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("PayOrders");

            // Header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.size(); i++) {
                headerRow.createCell(i).setCellValue(columns.get(i));
            }

            // Data rows
            for (int i = 0; i < orders.size(); i++) {
                Row row = sheet.createRow(i + 1);
                PayOrder order = orders.get(i);
                for (int j = 0; j < columns.size(); j++) {
                    setCellValue(row, j, columns.get(j), order);
                }
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessRuleException("MSG-ERR-SYSTEM", "Loi khi xuat Excel: " + e.getMessage());
        }
    }

    private byte[] exportPdf(List<PayOrder> orders, List<String> columns) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("Danh sach lenh thanh toan di thu cong"));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(columns.size());
            // Header
            for (String col : columns) {
                table.addCell(col);
            }
            // Data
            for (PayOrder order : orders) {
                for (String col : columns) {
                    table.addCell(getFieldValue(col, order));
                }
            }
            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessRuleException("MSG-ERR-SYSTEM", "Loi khi xuat PDF: " + e.getMessage());
        }
    }

    private byte[] exportCsv(List<PayOrder> orders, List<String> columns) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             CSVWriter writer = new CSVWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {
            // Header
            writer.writeNext(columns.toArray(new String[0]));
            // Data
            for (PayOrder order : orders) {
                String[] row = new String[columns.size()];
                for (int i = 0; i < columns.size(); i++) {
                    row[i] = getFieldValue(columns.get(i), order);
                }
                writer.writeNext(row);
            }
            writer.flush();
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessRuleException("MSG-ERR-SYSTEM", "Loi khi xuat CSV: " + e.getMessage());
        }
    }

    private void setCellValue(Row row, int colIdx, String column, PayOrder order) {
        String value = getFieldValue(column, order);
        row.createCell(colIdx).setCellValue(value);
    }

    private String getFieldValue(String column, PayOrder order) {
        return switch (column.toUpperCase()) {
            case "REF_NO" -> nvl(order.getRefNo());
            case "CHANNEL" -> nvl(order.getChannel());
            case "ORDER_TYPE" -> nvl(order.getOrderType());
            case "STATUS" -> nvl(order.getStatus() != null ? order.getStatus().name() : null);
            case "AMOUNT" -> nvl(order.getAmount() != null ? order.getAmount().toPlainString() : null);
            case "CURRENCY_CODE" -> nvl(order.getCurrencyCode());
            case "PAYMENT_DATE" -> order.getPaymentDate() != null ? order.getPaymentDate().format(DATE_FMT) : "";
            case "DESCRIPTION" -> nvl(order.getDescription());
            case "SENDER" -> nvl(order.getSender());
            case "RECEIVER" -> nvl(order.getReceiver());
            case "SENDER_NAME" -> nvl(order.getSenderName());
            case "RECEIVER_NAME" -> nvl(order.getReceiverName());
            case "CREATED_BY" -> nvl(order.getCreatedBy());
            case "CREATED_AT" -> order.getCreatedAt() != null ? order.getCreatedAt().toString() : "";
            case "KBNN_ID" -> nvl(order.getKbnnId());
            default -> "";
        };
    }

    private String nvl(String val) {
        return val != null ? val : "";
    }

    private List<String> getDefaultColumns() {
        return List.of("REF_NO", "CHANNEL", "ORDER_TYPE", "STATUS", "AMOUNT",
                "CURRENCY_CODE", "PAYMENT_DATE", "DESCRIPTION", "CREATED_BY", "CREATED_AT");
    }
}
