package com.kb.ltt.infrastructure.persistence;

import com.kb.ltt.domain.model.LttDetail;
import com.kb.ltt.domain.model.LttFilterRequest;
import com.kb.ltt.domain.model.LttHeader;
import com.kb.ltt.domain.model.LttReceiver;
import com.kb.ltt.domain.model.LttSender;
import com.kb.ltt.domain.port.outbound.LttRepository;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Infrastructure adapter implementing the domain LttRepository port.
 * Delegates to Spring Data JPA repositories for actual persistence.
 *
 * Follows Hexagonal Architecture: this is the outbound adapter
 * that bridges domain layer to JPA infrastructure.
 *
 * // FT-001: LTT repository adapter implementation
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LttRepositoryImpl implements LttRepository {

    private final LttHeaderJpaRepository headerRepository;
    private final LttDetailJpaRepository detailRepository;
    private final LttSenderJpaRepository senderRepository;
    private final LttReceiverJpaRepository receiverRepository;

    // ========================================================================
    // LttHeader operations
    // ========================================================================

    @Override
    public LttHeader saveHeader(LttHeader header) {
        return headerRepository.save(header);
    }

    @Override
    public Optional<LttHeader> findHeaderById(Long id) {
        return headerRepository.findById(id);
    }

    @Override
    public Optional<LttHeader> findHeaderByIdempotencyKey(String idempotencyKey) {
        return headerRepository.findByIdempotencyKey(idempotencyKey);
    }

    /**
     * Dynamic search using JPA Specifications based on filter criteria.
     * Maps to the BA spec Section 2.1 (MOD.LIST) filter fields.
     */
    @Override
    public Page<LttHeader> searchHeaders(LttFilterRequest filter, Pageable pageable) {
        Specification<LttHeader> spec = buildFilterSpecification(filter);
        return headerRepository.findAll(spec, pageable);
    }

    // ========================================================================
    // LttDetail operations
    // ========================================================================

    @Override
    public List<LttDetail> findDetailsByLttId(Long lttId) {
        return detailRepository.findByLttIdOrderByLineNoAsc(lttId);
    }

    @Override
    public LttDetail saveDetail(LttDetail detail) {
        return detailRepository.save(detail);
    }

    @Override
    public List<LttDetail> saveAllDetails(List<LttDetail> details) {
        return detailRepository.saveAll(details);
    }

    @Override
    public void deleteDetailsByLttId(Long lttId) {
        detailRepository.deleteByLttId(lttId);
    }

    // ========================================================================
    // LttSender operations
    // ========================================================================

    @Override
    public Optional<LttSender> findSenderByLttId(Long lttId) {
        return senderRepository.findByLttId(lttId);
    }

    @Override
    public LttSender saveSender(LttSender sender) {
        return senderRepository.save(sender);
    }

    // ========================================================================
    // LttReceiver operations
    // ========================================================================

    @Override
    public Optional<LttReceiver> findReceiverByLttId(Long lttId) {
        return receiverRepository.findByLttId(lttId);
    }

    @Override
    public LttReceiver saveReceiver(LttReceiver receiver) {
        return receiverRepository.save(receiver);
    }

    // ========================================================================
    // Private helper: Dynamic filter Specification builder
    // ========================================================================

    /**
     * Builds a JPA Specification from the filter request.
     * Each filter field is translated into a WHERE clause predicate.
     *
     * // FT-001: Dynamic query builder for MOD.LIST filters
     */
    private Specification<LttHeader> buildFilterSpecification(LttFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter == null) {
                return criteriaBuilder.conjunction();
            }

            // Channel filter
            if (filter.getChannel() != null) {
                predicates.add(criteriaBuilder.equal(root.get("channel"), filter.getChannel()));
            }

            // Transaction type filter
            if (filter.getTransactionType() != null && !filter.getTransactionType().isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        root.get("transactionType"), filter.getTransactionType()));
            }

            // LNH Transaction type filter (only for LNH channel)
            if (filter.getLnhTransactionType() != null && !filter.getLnhTransactionType().isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        root.get("lnhTransactionType"), filter.getLnhTransactionType()));
            }

            // REF_NO filter (exact or starts-with)
            if (filter.getRefNo() != null && !filter.getRefNo().isBlank()) {
                predicates.add(criteriaBuilder.like(
                        root.get("refNo"), filter.getRefNo() + "%"));
            }

            // Origin number filter
            if (filter.getOriginNum() != null && !filter.getOriginNum().isBlank()) {
                predicates.add(criteriaBuilder.like(
                        root.get("originNum"), filter.getOriginNum() + "%"));
            }

            // Status filter
            if (filter.getFStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("fStatus"), filter.getFStatus()));
            }

            // Sender code filter
            if (filter.getSenderCode() != null && !filter.getSenderCode().isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("senderCode"), filter.getSenderCode()));
            }

            // Receiver code filter
            if (filter.getReceiverCode() != null && !filter.getReceiverCode().isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("receiverCode"), filter.getReceiverCode()));
            }

            // Amount range filter
            if (filter.getAmountFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("amount"), filter.getAmountFrom()));
            }
            if (filter.getAmountTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("amount"), filter.getAmountTo()));
            }

            // Currency filter
            if (filter.getCurrencyCode() != null && !filter.getCurrencyCode().isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        root.get("currencyCode"), filter.getCurrencyCode()));
            }

            // Date range filter (dynamic based on dateField)
            String dateField = filter.getDateField() != null ? filter.getDateField() : "createdDate";
            if (filter.getFromDate() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get(mapDateField(dateField)), filter.getFromDate()));
            }
            if (filter.getToDate() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get(mapDateField(dateField)), filter.getToDate()));
            }

            // User filters
            if (filter.getCreatedBy() != null && !filter.getCreatedBy().isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("createdBy"), filter.getCreatedBy()));
            }
            if (filter.getCheckedBy() != null && !filter.getCheckedBy().isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("checkedBy"), filter.getCheckedBy()));
            }
            if (filter.getApprovedBy() != null && !filter.getApprovedBy().isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("approvedBy"), filter.getApprovedBy()));
            }

            // By default, exclude DELETED records unless explicitly requested
            if (filter.getFStatus() == null) {
                predicates.add(criteriaBuilder.notEqual(root.get("fStatus"), "DELETED"));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Maps the date field name from the filter to the entity field name.
     */
    private String mapDateField(String dateField) {
        return switch (dateField) {
            case "PAYMENT_DATE" -> "paymentDate";
            case "CHECKED_DATE" -> "checkedDate";
            case "APPROVED_DATE" -> "approvedDate";
            default -> "createdDate";
        };
    }
}
