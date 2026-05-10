package vn.gov.kbnn.vdbas.ltt.domain.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
public class LttEvent {
    private Long lttId;
    private String soYctt;
    private String state;
    private BigDecimal amount;
    private String currency;
    private LocalDate paymentDate;
    private String channel;
    private String eventType;
    private OffsetDateTime eventTimestamp;
    private String userId;
    private String userRole;
    private String reason;
}
