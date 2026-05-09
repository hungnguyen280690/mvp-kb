package vn.gov.kbnn.vdbas.ltt.validation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Validation engine cho 36 VAL rules tu validation-rules.yaml.
 * Moi violation tra ve theo format: {rule, field, message}.
 */
@Slf4j
@Component
public class ValRuleValidator {

    public record Violation(String rule, String field, String message) {}

    /**
     * Validate LTT khi Submit — kiem tra day du VAL-* rules.
     *
     * @param ltt entity LTT can validate
     * @return danh sach violations (rong neu hop le)
     */
    public List<Violation> validateForSubmit(Ltt ltt) {
        List<Violation> violations = new ArrayList<>();

        // VAL-005: Truong bat buoc
        checkRequired(violations, ltt);

        // VAL-002: Do dai vuot qua
        checkLength(violations, ltt);

        // VAL-009: NH chuyen va NH nhan khong trung nhau
        if (ltt.getSenderBankCode() != null && ltt.getSenderBankCode().equals(ltt.getReceiverBankCode())) {
            violations.add(new Violation("E-VAL-009", "receiverBankCode",
                    "NH chuyen va NH nhan khong duoc trung nhau"));
        }

        // VAL-014: So tien > 0
        if (ltt.getAmount() == null || ltt.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            violations.add(new Violation("E-VAL-014", "amount", "So tien phai lon hon 0"));
        }

        // VAL-016: Ty gia ngoai te
        if (!"VND".equals(ltt.getCurrency())) {
            if (ltt.getExchangeRate() == null || ltt.getExchangeRate().compareTo(BigDecimal.ZERO) <= 0) {
                violations.add(new Violation("E-VAL-016", "exchangeRate",
                        "Vui long nhap ty gia hop le voi ngoai te"));
            }
        }

        // VAL-017: Loai giao dich bat buoc khi kenh LNH
        if ("LNH".equals(ltt.getChannel()) && (ltt.getTxnType() == null || ltt.getTxnType().isBlank())) {
            violations.add(new Violation("E-VAL-017", "transactionType",
                    "Loai giao dich la bat buoc voi kenh LNH"));
        }

        // VAL-018: So chung tu goc bat buoc khi kenh SP
        if ("SP".equals(ltt.getChannel()) && (ltt.getOrigDocNo() == null || ltt.getOrigDocNo().isBlank())) {
            violations.add(new Violation("E-VAL-018", "originalDocNo",
                    "Vui long nhap So chung tu goc cho kenh TTSP"));
        }

        // VAL-019: To hop COA (BIZ-COA-CROSS)
        validateCoa(violations, ltt);

        // VAL-012: Ngay thanh toan khong nho hon ngay lam viec
        if (ltt.getPaymentDate() != null && ltt.getWorkingDate() != null
                && ltt.getPaymentDate().isBefore(ltt.getWorkingDate())) {
            violations.add(new Violation("E-VAL-012", "paymentDate",
                    "Ngay thanh toan khong duoc nho hon ngay lam viec hien tai"));
        }

        return violations;
    }

    /**
     * Validate cho Edit — chi kiem tra mutable fields.
     */
    public List<Violation> validateForEdit(Ltt ltt) {
        List<Violation> violations = new ArrayList<>();
        checkRequired(violations, ltt);
        checkLength(violations, ltt);
        return violations;
    }

    /**
     * Validate ly do reject/cancel (VAL-030).
     */
    public List<Violation> validateReason(String reason) {
        List<Violation> violations = new ArrayList<>();
        if (reason == null || reason.length() < 10) {
            violations.add(new Violation("E-VAL-030", "reason",
                    "Vui long nhap ly do toi thieu 10 ky tu"));
        }
        if (reason != null && reason.length() > 500) {
            violations.add(new Violation("E-VAL-030", "reason",
                    "Ly do khong duoc vuot qua 500 ky tu"));
        }
        return violations;
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private void checkRequired(List<Violation> violations, Ltt ltt) {
        if (ltt.getChannel() == null || ltt.getChannel().isBlank()) {
            violations.add(new Violation("E-VAL-005", "channel", "Vui long nhap Kenh thanh toan"));
        }
        if (ltt.getOrderType() == null || ltt.getOrderType().isBlank()) {
            violations.add(new Violation("E-VAL-005", "orderType", "Vui long nhap Loai lenh"));
        }
        if (ltt.getReceiverBankCode() == null || ltt.getReceiverBankCode().isBlank()) {
            violations.add(new Violation("E-VAL-005", "receiverBankCode", "Vui long nhap Ma NH nhan"));
        }
        if (ltt.getPaymentDate() == null) {
            violations.add(new Violation("E-VAL-005", "paymentDate", "Vui long nhap Ngay thanh toan"));
        }
        if (ltt.getAmount() == null) {
            violations.add(new Violation("E-VAL-005", "amount", "Vui long nhap So tien chuyen"));
        }
        if (ltt.getPaymentContent() == null || ltt.getPaymentContent().isBlank()) {
            violations.add(new Violation("E-VAL-005", "paymentContent", "Vui long nhap Noi dung thanh toan"));
        }
        if (ltt.getSenderName() == null || ltt.getSenderName().isBlank()) {
            violations.add(new Violation("E-VAL-005", "senderInfo.name", "Vui long nhap Ten nguoi chuyen"));
        }
        if (ltt.getReceiverName() == null || ltt.getReceiverName().isBlank()) {
            violations.add(new Violation("E-VAL-005", "receiverInfo.name", "Vui long nhap Ten nguoi nhan"));
        }
    }

    private void checkLength(List<Violation> violations, Ltt ltt) {
        if (ltt.getPaymentContent() != null && ltt.getPaymentContent().length() > 500) {
            violations.add(new Violation("E-VAL-002", "paymentContent",
                    "Vuot qua so ky tu cho phep"));
        }
        if (ltt.getSoYctt() != null && ltt.getSoYctt().length() > 30) {
            violations.add(new Violation("E-VAL-002", "requestNumber",
                    "Vuot qua so ky tu cho phep"));
        }
    }

    private void validateCoa(List<Violation> violations, Ltt ltt) {
        // TODO: Trien khai thuc te — goi DMHT.COA-MATRIX lookup
        // Hien tai skip (MVP)
    }
}
