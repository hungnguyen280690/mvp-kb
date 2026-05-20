package com.kb.ltt.application;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.enums.OrderChannel;
import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.port.in.ExportOrdersUseCase;
import com.kb.ltt.port.out.PayOrderRepository;
import com.kb.ltt.port.out.PayOrderSpecification;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Export orders to XLSX/PDF/CSV.
 * BDD: bdd-06-export.md.
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
    public byte[] export(ExportQuery query) {
        String format = query.format();
        if (format == null || (!format.equals("XLSX") && !format.equals("PDF") && !format.equals("CSV"))) {
            throw new BusinessRuleException("MSG-ERR-VALIDATION", "FORMAT khong hop le. Chi ho tro XLSX, PDF, CSV.");
        }

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

        PayOrderRepository.PayOrderPage page = payOrderRepository.findAll(spec, 0, MAX_EXPORT_ROWS, "createdAt", "DESC");

        if (page.totalElements() > MAX_EXPORT_ROWS) {
            throw new BusinessRuleException("MSG-ERR-EXPORT",
                    "So luong ban ghi vuot qua gioi han 50,000. Hien tai: " + page.totalElements());
        }

        List<PayOrder> orders = page.content();
        List<String> columns = getDefaultColumns();

        return switch (format) {
            case "XLSX" -> exportExcel(orders, columns);
            case "PDF" -> exportPdf(orders, columns);
            case "CSV" -> exportCsv(orders, columns);
            default -> throw new BusinessRuleException("MSG-ERR-VALIDATION", "FORMAT khong ho tro: " + format);
        };
    }

    private byte[] exportExcel(List<PayOrder> orders, List<String> columns) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("PayOrders");
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.size(); i++) headerRow.createCell(i).setCellValue(columns.get(i));
            for (int i = 0; i < orders.size(); i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < columns.size(); j++)
                    row.createCell(j).setCellValue(getFieldValue(columns.get(j), orders.get(i)));
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
            for (String col : columns) table.addCell(col);
            for (PayOrder order : orders)
                for (String col : columns) table.addCell(getFieldValue(col, order));
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
            writer.writeNext(columns.toArray(new String[0]));
            for (PayOrder order : orders) {
                String[] row = new String[columns.size()];
                for (int i = 0; i < columns.size(); i++) row[i] = getFieldValue(columns.get(i), order);
                writer.writeNext(row);
            }
            writer.flush();
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessRuleException("MSG-ERR-SYSTEM", "Loi khi xuat CSV: " + e.getMessage());
        }
    }

    private String getFieldValue(String column, PayOrder order) {
        return switch (column.toUpperCase()) {
            case "REF_NO" -> nvl(order.getRefNo());
            case "CHANNEL" -> order.getChannel() != null ? order.getChannel().name() : "";
            case "ORDER_TYPE" -> nvl(order.getOrderType());
            case "STATUS" -> order.getStatus() != null ? order.getStatus().name() : "";
            case "AMOUNT" -> order.getAmount() != null ? order.getAmount().toPlainString() : "";
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

    private String nvl(String val) { return val != null ? val : ""; }

    private List<String> getDefaultColumns() {
        return List.of("REF_NO", "CHANNEL", "ORDER_TYPE", "STATUS", "AMOUNT",
                "CURRENCY_CODE", "PAYMENT_DATE", "DESCRIPTION", "CREATED_BY", "CREATED_AT");
    }
}
