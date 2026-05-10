package vn.gov.kbnn.vdbas.bff.dto;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class AuditTrailResponse {
    private List<AuditEntryDto> content;
    private PageInfo page;

    @Data
    public static class PageInfo {
        private int number;
        private int size;
        private long totalElements;
        private int totalPages;
    }

    @Data
    public static class AuditEntryDto {
        private Long id;
        private Long paymentOrderId;
        private String action;
        private String userId;
        private String userName;
        private String userRole;
        private OffsetDateTime timestamp;
        private String previousStatus;
        private String newStatus;
        private Integer version;
        private List<FieldDiff> diffs;
        private String reason;
        private String ipAddress;
        private String auditHash;
    }

    @Data
    public static class FieldDiff {
        private String field;
        private String oldValue;
        private String newValue;
    }
}
