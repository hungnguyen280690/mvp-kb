package com.kb.ltt.application.usecase;

import com.kb.ltt.domain.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Provides hard-coded stub lookup data for LOV (List of Values) dropdowns.
 * MVP implementation — replace with database-backed queries in production.
 */
@Service
public class LookupUseCase {

    // ── Inner records ─────────────────────────────────────────────────────

    public record LookupItem(String code, String name, Map<String, Object> extra) {
        public LookupItem(String code, String name) {
            this(code, name, Map.of());
        }
    }

    public record LookupResult(List<LookupItem> content, int totalElements) {}

    // ── Stub data ─────────────────────────────────────────────────────────

    private static final List<LookupItem> BANKS = List.of(
            new LookupItem("HN001", "KBNN Hà Nội"),
            new LookupItem("HN002", "KBNN Đống Đa"),
            new LookupItem("HN003", "KBNN Cầu Giấy"),
            new LookupItem("HN004", "KBNN Hoàn Kiếm"),
            new LookupItem("HN005", "KBNN Hai Bà Trưng")
    );

    private static final List<LookupItem> USERS = List.of(
            new LookupItem("user001", "Nguyễn Văn A"),
            new LookupItem("user002", "Trần Thị B"),
            new LookupItem("user003", "Lê Văn C"),
            new LookupItem("user004", "Phạm Thị D"),
            new LookupItem("user005", "Hoàng Văn E")
    );

    private static final List<LookupItem> CURRENCIES = List.of(
            new LookupItem("VND", "Đồng Việt Nam"),
            new LookupItem("USD", "US Dollar"),
            new LookupItem("EUR", "Euro")
    );

    private static final List<LookupItem> DVQHNS = List.of(
            new LookupItem("DVQHNS001", "Đơn vị quan hệ ngân sách 001"),
            new LookupItem("DVQHNS002", "Đơn vị quan hệ ngân sách 002"),
            new LookupItem("DVQHNS003", "Đơn vị quan hệ ngân sách 003")
    );

    private static final List<LookupItem> COA_SEGMENTS = List.of(
            new LookupItem("1111", "TK 1111 - Tiền gửi KBNN"),
            new LookupItem("1112", "TK 1112 - Tiền mặt"),
            new LookupItem("3311", "TK 3311 - Phải trả nhà cung cấp"),
            new LookupItem("6111", "TK 6111 - Chi đầu tư XDCB"),
            new LookupItem("6211", "TK 6211 - Chi thường xuyên")
    );

    private static final List<LookupItem> EXPENSE_TYPES = List.of(
            new LookupItem("EXP01", "Chi thường xuyên"),
            new LookupItem("EXP02", "Chi đầu tư"),
            new LookupItem("EXP03", "Chi bổ sung có mục tiêu"),
            new LookupItem("EXP04", "Chi từ nguồn vốn vay"),
            new LookupItem("EXP05", "Chi khác")
    );

    private static final List<LookupItem> ORDER_TYPES = List.of(
            new LookupItem("LCKT", "Lệnh chuyển khoản"),
            new LookupItem("LTPCP", "Lệnh trái phiếu CP"),
            new LookupItem("LDTXD", "Lệnh đầu tư XDCB"),
            new LookupItem("LTTPHTM", "Lệnh thanh toán phí, hoa hồng"),
            new LookupItem("LTTT", "Lệnh thanh toán thường xuyên")
    );

    // ── Lookup method ─────────────────────────────────────────────────────

    /**
     * Returns stub lookup data for the given type, filtered by optional query string, with pagination.
     *
     * @param type lookup type (BANK, USER, CURRENCY, DVQHNS, COA_SEGMENT, EXPENSE_TYPE, ORDER_TYPE)
     * @param q    optional search query (matches on code or name, case-insensitive)
     * @param page zero-based page index
     * @param size page size
     * @return paginated lookup result
     */
    public LookupResult lookup(String type, String q, int page, int size) {
        List<LookupItem> source = getSource(type);

        // Filter by q
        List<LookupItem> filtered = new ArrayList<>();
        for (LookupItem item : source) {
            if (q == null || q.isBlank()) {
                filtered.add(item);
            } else {
                String qLower = q.toLowerCase();
                if (item.code().toLowerCase().contains(qLower)
                        || item.name().toLowerCase().contains(qLower)) {
                    filtered.add(item);
                }
            }
        }

        // Pagination
        int total = filtered.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<LookupItem> pageContent = filtered.subList(fromIndex, toIndex);

        return new LookupResult(pageContent, total);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private List<LookupItem> getSource(String type) {
        if (type == null) {
            throw new BusinessException("MSG-ERR-LOOKUP-TYPE", "Loại tra cứu không được rỗng.");
        }
        return switch (type.toUpperCase()) {
            case "BANK"         -> BANKS;
            case "USER"         -> USERS;
            case "CURRENCY"     -> CURRENCIES;
            case "DVQHNS"       -> DVQHNS;
            case "COA_SEGMENT"  -> COA_SEGMENTS;
            case "EXPENSE_TYPE" -> EXPENSE_TYPES;
            case "ORDER_TYPE"   -> ORDER_TYPES;
            default -> throw new BusinessException("MSG-ERR-LOOKUP-TYPE",
                    "Loại tra cứu không hợp lệ: " + type);
        };
    }
}
