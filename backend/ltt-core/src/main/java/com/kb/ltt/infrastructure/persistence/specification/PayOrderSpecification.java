package com.kb.ltt.infrastructure.persistence.specification;

import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Static factory methods for building JPA {@link Specification}s for PayOrderEntity.
 * Compose with {@code Specification.where(...).and(...)} in ListPayOrderUseCase.
 */
public final class PayOrderSpecification {

    private PayOrderSpecification() {
        // Utility class
    }

    public static Specification<PayOrderEntity> byKbnnId(String kbnnId) {
        return (root, query, cb) ->
                kbnnId == null ? null : cb.equal(root.get("kbnnId"), kbnnId);
    }

    public static Specification<PayOrderEntity> byStatus(List<String> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) return null;
            return root.get("status").in(statuses);
        };
    }

    public static Specification<PayOrderEntity> byChannel(List<String> channels) {
        return (root, query, cb) -> {
            if (channels == null || channels.isEmpty()) return null;
            return root.get("channel").in(channels);
        };
    }

    public static Specification<PayOrderEntity> byRefNo(String refNo) {
        return (root, query, cb) ->
                refNo == null || refNo.isBlank() ? null
                        : cb.like(cb.upper(root.get("refNo")), "%" + refNo.toUpperCase() + "%");
    }

    public static Specification<PayOrderEntity> byReceiverName(String receiverName) {
        return (root, query, cb) ->
                receiverName == null || receiverName.isBlank() ? null
                        : cb.like(cb.upper(root.get("receiverName")),
                                  "%" + receiverName.toUpperCase() + "%");
    }

    public static Specification<PayOrderEntity> byPaymentDateRange(LocalDate from, LocalDate to) {
        return (root, query, cb) -> {
            if (from == null && to == null) return null;
            Predicate p = cb.conjunction();
            if (from != null) p = cb.and(p, cb.greaterThanOrEqualTo(root.get("paymentDate"), from));
            if (to != null)   p = cb.and(p, cb.lessThanOrEqualTo(root.get("paymentDate"), to));
            return p;
        };
    }

    public static Specification<PayOrderEntity> byAmountRange(BigDecimal from, BigDecimal to) {
        return (root, query, cb) -> {
            if (from == null && to == null) return null;
            Predicate p = cb.conjunction();
            if (from != null) p = cb.and(p, cb.greaterThanOrEqualTo(root.get("amount"), from));
            if (to != null)   p = cb.and(p, cb.lessThanOrEqualTo(root.get("amount"), to));
            return p;
        };
    }

    public static Specification<PayOrderEntity> byCreatedBy(String createdBy) {
        return (root, query, cb) ->
                createdBy == null || createdBy.isBlank() ? null
                        : cb.equal(root.get("createdBy"), createdBy);
    }

    public static Specification<PayOrderEntity> excludeDeleted() {
        return (root, query, cb) ->
                cb.notEqual(root.get("status"), "DELETED");
    }
}
