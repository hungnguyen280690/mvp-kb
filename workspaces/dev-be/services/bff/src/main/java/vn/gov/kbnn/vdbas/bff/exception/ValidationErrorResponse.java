package vn.gov.kbnn.vdbas.bff.exception;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class ValidationErrorResponse {
    private String code;
    private String message;
    private String traceId;
    private OffsetDateTime timestamp;
    private List<Violation> violations;

    @Data
    public static class Violation {
        private final String rule;
        private final String field;
        private final String message;

        public Violation(String rule, String field, String message) {
            this.rule = rule;
            this.field = field;
            this.message = message;
        }
    }
}
