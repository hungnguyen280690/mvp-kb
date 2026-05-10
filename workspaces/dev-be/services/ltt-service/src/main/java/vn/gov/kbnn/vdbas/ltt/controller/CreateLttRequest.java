package vn.gov.kbnn.vdbas.ltt.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateLttRequest(
    String channel,
    String orderType,
    String transactionType,
    String receiverBankCode,
    LocalDate paymentDate,
    BigDecimal amount,
    String currency,
    String originalDocNo,
    LocalDate originalDocDate,
    String feeType,
    String debitCurrency,
    String paymentCurrency,
    String paymentContent,
    List<LineItem> lineItems,
    SenderInfo senderInfo,
    ReceiverInfo receiverInfo
) {
    public record LineItem(
        String fundCode,
        String naturalAccount,
        String dvqhns,
        String budgetLevel,
        String chapter,
        String economicSector,
        String ndkt,
        String area,
        String program,
        String fundSource,
        String treasuryCode,
        String reserve,
        String description,
        BigDecimal itemAmount
    ) {}

    public record SenderInfo(
        String name,
        String address,
        String accountNumber,
        String customerCode,
        String bankCode,
        String bankName,
        String identityDoc,
        LocalDate identityDocIssueDate,
        String identityDocIssuePlace,
        String tpcpCode
    ) {}

    public record ReceiverInfo(
        String name,
        String address,
        String accountNumber,
        String bankCode,
        String bankName,
        String accountName,
        String identityDoc,
        LocalDate identityDocIssueDate,
        String identityDocIssuePlace
    ) {}
}
