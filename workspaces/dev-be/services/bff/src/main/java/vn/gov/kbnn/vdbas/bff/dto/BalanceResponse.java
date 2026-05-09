package vn.gov.kbnn.vdbas.bff.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
public class BalanceResponse {
    private String accountNumber;
    private String currency;
    private BigDecimal balance;
    private BigDecimal holdAmount;
    private BigDecimal availableBalance;
    private OffsetDateTime asOfTimestamp;
}
