package vn.gov.kbnn.vdbas.ltt.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test cho ValRuleValidator — test key validation rules.
 */
class ValRuleValidatorTest {

    private ValRuleValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ValRuleValidator();
    }

    /**
     * Tao LTT hop le day du thong tin.
     */
    private Ltt createValidLtt() {
        return Ltt.builder()
                .soYctt("10052026000001")
                .channel("LNH")
                .orderType("OT-LNH-LCC")
                .senderBankCode("00010001")
                .receiverBankCode("00020002")
                .paymentDate(LocalDate.now())
                .amount(new BigDecimal("150000000.00"))
                .currency("VND")
                .paymentContent("Thanh toan hop dong 001/2026")
                .senderName("KBNN Ha Noi")
                .senderAccount("1121001000001")
                .receiverName("NHNN Chi nhanh Ha Noi")
                .unitCode("001001")
                .workingDate(LocalDate.now())
                .build();
    }

    // =========================================================================
    // Valid LTT tests
    // =========================================================================
    @Nested
    @DisplayName("Valid LTT — no violations")
    class ValidLtt {

        @Test
        @DisplayName("Valid LTT returns no violations")
        void validLttNoViolations() {
            Ltt ltt = createValidLtt();
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.isEmpty(), "Valid LTT should have no violations, got: " + violations);
        }
    }

    // =========================================================================
    // VAL-005: Required fields
    // =========================================================================
    @Nested
    @DisplayName("VAL-005: Required fields")
    class RequiredFields {

        @Test
        @DisplayName("Missing channel -> E-VAL-005")
        void missingChannel() {
            Ltt ltt = createValidLtt();
            ltt.setChannel(null);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-005".equals(v.rule()) && "channel".equals(v.field())));
        }

        @Test
        @DisplayName("Missing amount -> E-VAL-005")
        void missingAmount() {
            Ltt ltt = createValidLtt();
            ltt.setAmount(null);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-005".equals(v.rule()) && "amount".equals(v.field())));
        }

        @Test
        @DisplayName("Missing paymentContent -> E-VAL-005")
        void missingPaymentContent() {
            Ltt ltt = createValidLtt();
            ltt.setPaymentContent(null);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-005".equals(v.rule()) && "paymentContent".equals(v.field())));
        }

        @Test
        @DisplayName("Empty senderName -> E-VAL-005")
        void emptySenderName() {
            Ltt ltt = createValidLtt();
            ltt.setSenderName("");
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-005".equals(v.rule()) && "senderInfo.name".equals(v.field())));
        }
    }

    // =========================================================================
    // VAL-009: NH chuyen != NH nhan
    // =========================================================================
    @Nested
    @DisplayName("VAL-009: Sender bank != Receiver bank")
    class SameBankValidation {

        @Test
        @DisplayName("Same bank codes -> E-VAL-009")
        void sameBankCode() {
            Ltt ltt = createValidLtt();
            ltt.setReceiverBankCode(ltt.getSenderBankCode());
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-009".equals(v.rule())));
        }

        @Test
        @DisplayName("Different bank codes -> no E-VAL-009")
        void differentBankCode() {
            Ltt ltt = createValidLtt();
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertFalse(violations.stream().anyMatch(v -> "E-VAL-009".equals(v.rule())));
        }
    }

    // =========================================================================
    // VAL-014: Amount > 0
    // =========================================================================
    @Nested
    @DisplayName("VAL-014: Amount must be > 0")
    class AmountValidation {

        @Test
        @DisplayName("Amount = 0 -> E-VAL-014")
        void zeroAmount() {
            Ltt ltt = createValidLtt();
            ltt.setAmount(BigDecimal.ZERO);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-014".equals(v.rule())));
        }

        @Test
        @DisplayName("Amount negative -> E-VAL-014")
        void negativeAmount() {
            Ltt ltt = createValidLtt();
            ltt.setAmount(new BigDecimal("-100"));
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-014".equals(v.rule())));
        }
    }

    // =========================================================================
    // VAL-016: Exchange rate for foreign currency
    // =========================================================================
    @Nested
    @DisplayName("VAL-016: Exchange rate required for foreign currency")
    class ExchangeRateValidation {

        @Test
        @DisplayName("USD without exchange rate -> E-VAL-016")
        void usdNoExchangeRate() {
            Ltt ltt = createValidLtt();
            ltt.setCurrency("USD");
            ltt.setExchangeRate(null);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-016".equals(v.rule())));
        }

        @Test
        @DisplayName("USD with exchange rate -> no E-VAL-016")
        void usdWithExchangeRate() {
            Ltt ltt = createValidLtt();
            ltt.setCurrency("USD");
            ltt.setExchangeRate(new BigDecimal("25000.00"));
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertFalse(violations.stream().anyMatch(v -> "E-VAL-016".equals(v.rule())));
        }

        @Test
        @DisplayName("VND without exchange rate -> no E-VAL-016")
        void vndNoExchangeRate() {
            Ltt ltt = createValidLtt();
            ltt.setCurrency("VND");
            ltt.setExchangeRate(null);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertFalse(violations.stream().anyMatch(v -> "E-VAL-016".equals(v.rule())));
        }
    }

    // =========================================================================
    // VAL-017: Transaction type required for LNH
    // =========================================================================
    @Nested
    @DisplayName("VAL-017: Transaction type required for LNH channel")
    class TransactionTypeValidation {

        @Test
        @DisplayName("LNH without txnType -> E-VAL-017")
        void lnhNoTxnType() {
            Ltt ltt = createValidLtt();
            ltt.setChannel("LNH");
            ltt.setTxnType(null);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-017".equals(v.rule())));
        }

        @Test
        @DisplayName("SP without txnType -> no E-VAL-017")
        void spNoTxnType() {
            Ltt ltt = createValidLtt();
            ltt.setChannel("SP");
            ltt.setTxnType(null);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertFalse(violations.stream().anyMatch(v -> "E-VAL-017".equals(v.rule())));
        }
    }

    // =========================================================================
    // VAL-018: Original doc number required for SP
    // =========================================================================
    @Nested
    @DisplayName("VAL-018: Original doc number required for SP channel")
    class OriginalDocValidation {

        @Test
        @DisplayName("SP without origDocNo -> E-VAL-018")
        void spNoOrigDocNo() {
            Ltt ltt = createValidLtt();
            ltt.setChannel("SP");
            ltt.setOrigDocNo(null);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-018".equals(v.rule())));
        }

        @Test
        @DisplayName("LNH without origDocNo -> no E-VAL-018")
        void lnhNoOrigDocNo() {
            Ltt ltt = createValidLtt();
            ltt.setChannel("LNH");
            ltt.setOrigDocNo(null);
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertFalse(violations.stream().anyMatch(v -> "E-VAL-018".equals(v.rule())));
        }
    }

    // =========================================================================
    // VAL-012: Payment date not before working date
    // =========================================================================
    @Nested
    @DisplayName("VAL-012: Payment date >= working date")
    class PaymentDateValidation {

        @Test
        @DisplayName("Payment date before working date -> E-VAL-012")
        void pastPaymentDate() {
            Ltt ltt = createValidLtt();
            ltt.setWorkingDate(LocalDate.now());
            ltt.setPaymentDate(LocalDate.now().minusDays(1));
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-012".equals(v.rule())));
        }

        @Test
        @DisplayName("Payment date = working date -> no E-VAL-012")
        void samePaymentDate() {
            Ltt ltt = createValidLtt();
            ltt.setWorkingDate(LocalDate.now());
            ltt.setPaymentDate(LocalDate.now());
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertFalse(violations.stream().anyMatch(v -> "E-VAL-012".equals(v.rule())));
        }
    }

    // =========================================================================
    // VAL-030: Reason validation
    // =========================================================================
    @Nested
    @DisplayName("VAL-030: Reason 10-500 characters")
    class ReasonValidation {

        @Test
        @DisplayName("Reason < 10 chars -> E-VAL-030")
        void shortReason() {
            List<ValRuleValidator.Violation> violations = validator.validateReason("short");
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-030".equals(v.rule())));
        }

        @Test
        @DisplayName("Reason null -> E-VAL-030")
        void nullReason() {
            List<ValRuleValidator.Violation> violations = validator.validateReason(null);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-030".equals(v.rule())));
        }

        @Test
        @DisplayName("Reason >= 10 chars -> no violations")
        void validReason() {
            List<ValRuleValidator.Violation> violations = validator.validateReason("This is a valid reason for rejection that meets the minimum character requirement");
            assertTrue(violations.isEmpty());
        }
    }

    // =========================================================================
    // VAL-002: Length validation
    // =========================================================================
    @Nested
    @DisplayName("VAL-002: Field length validation")
    class LengthValidation {

        @Test
        @DisplayName("Payment content > 500 chars -> E-VAL-002")
        void longPaymentContent() {
            Ltt ltt = createValidLtt();
            ltt.setPaymentContent("A".repeat(501));
            List<ValRuleValidator.Violation> violations = validator.validateForSubmit(ltt);
            assertTrue(violations.stream().anyMatch(v -> "E-VAL-002".equals(v.rule()) && "paymentContent".equals(v.field())));
        }
    }
}
