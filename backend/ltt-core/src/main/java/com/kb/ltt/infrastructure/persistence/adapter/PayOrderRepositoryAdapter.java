package com.kb.ltt.infrastructure.persistence.adapter;

import com.kb.ltt.domain.PayOrder;
import com.kb.ltt.domain.exception.ResourceNotFoundException;
import com.kb.ltt.infrastructure.persistence.entity.*;
import com.kb.ltt.infrastructure.persistence.mapper.PayOrderMapper;
import com.kb.ltt.infrastructure.persistence.repository.*;
import com.kb.ltt.port.out.PayOrderRepository;
import com.kb.ltt.port.out.PayOrderSpecification;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * Adapter: Implements PayOrderRepository port using JPA infrastructure.
 * Hexagonal Architecture - adapter on the infrastructure side.
 */
@Component
@RequiredArgsConstructor
public class PayOrderRepositoryAdapter implements PayOrderRepository {

    private final PayOrderJpaRepository payOrderJpaRepository;
    private final PayOrderLineJpaRepository lineJpaRepository;
    private final PayOrderApprovalJpaRepository approvalJpaRepository;
    private final RefNoSequenceJpaRepository refNoSequenceJpaRepository;
    private final PayOrderMapper payOrderMapper;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public PayOrder save(PayOrder payOrder) {
        PayOrderEntity entity;

        if (payOrder.getId() != null && payOrderJpaRepository.existsById(payOrder.getId())) {
            // Update existing
            entity = payOrderJpaRepository.findById(payOrder.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("PayOrder", payOrder.getId()));
            payOrderMapper.updateEntityFromDomain(payOrder, entity);
        } else {
            // New entity
            entity = payOrderMapper.toEntity(payOrder);
        }

        // Save header first to get ID for children
        PayOrderEntity savedEntity = payOrderJpaRepository.save(entity);

        // Save lines (replace all)
        saveLines(savedEntity, payOrder.getLines());

        // Save approvals (append-only)
        saveApprovals(savedEntity, payOrder.getApprovals());

        // Flush and reload to get the complete entity with JPA-managed version
        entityManager.flush();
        entityManager.clear();

        PayOrderEntity reloaded = payOrderJpaRepository.findById(savedEntity.getId())
                .orElseThrow(() -> new ResourceNotFoundException("PayOrder", savedEntity.getId()));

        return payOrderMapper.toDomain(reloaded);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PayOrder> findById(String id) {
        return payOrderJpaRepository.findById(id)
                .map(payOrderMapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public PayOrderPage findAll(PayOrderSpecification spec, int page, int size, String sortBy, String sortDirection) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<PayOrderEntity> cq = cb.createQuery(PayOrderEntity.class);
        Root<PayOrderEntity> root = cq.from(PayOrderEntity.class);

        List<Predicate> predicates = buildPredicates(spec, root, cb);
        cq.where(predicates.toArray(new Predicate[0]));

        // Apply sorting
        boolean ascending = !"DESC".equalsIgnoreCase(sortDirection);
        cq.orderBy(ascending ? cb.desc(root.get(sortBy)) : cb.asc(root.get(sortBy)));

        // Execute query with pagination
        List<PayOrderEntity> entities = entityManager.createQuery(cq)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();

        // Count query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<PayOrderEntity> countRoot = countQuery.from(PayOrderEntity.class);
        countQuery.select(cb.count(countRoot));
        List<Predicate> countPredicates = buildPredicates(spec, countRoot, cb);
        countQuery.where(countPredicates.toArray(new Predicate[0]));
        Long total = entityManager.createQuery(countQuery).getSingleResult();

        List<PayOrder> domains = entities.stream()
                .map(payOrderMapper::toDomain)
                .toList();

        int totalPages = (int) Math.ceil((double) total / size);
        return new PayOrderPage(domains, total, totalPages, page, size);
    }

    @Override
    @Transactional
    public long findNextRefNoSeq(String kbnnId, String yearMonth) {
        // Atomic increment with pessimistic lock - INC-G-02
        Optional<RefNoSequenceEntity> existing = refNoSequenceJpaRepository.findWithLock(kbnnId, yearMonth);

        if (existing.isPresent()) {
            RefNoSequenceEntity seqEntity = existing.get();
            seqEntity.setLastSeq(seqEntity.getLastSeq() + 1);
            seqEntity.setUpdatedAt(OffsetDateTime.now());
            refNoSequenceJpaRepository.save(seqEntity);
            return seqEntity.getLastSeq();
        } else {
            RefNoSequenceEntity newSeq = RefNoSequenceEntity.builder()
                    .kbnnId(kbnnId)
                    .yearMonth(yearMonth)
                    .lastSeq(1L)
                    .updatedAt(OffsetDateTime.now())
                    .build();
            refNoSequenceJpaRepository.save(newSeq);
            return 1L;
        }
    }

    // ===== Private helpers =====

    private void saveLines(PayOrderEntity savedEntity, List<com.kb.ltt.domain.PayOrderLine> lines) {
        // Remove existing lines and re-insert (full replace strategy)
        lineJpaRepository.deleteByOrderId(savedEntity.getId());

        if (lines != null) {
            for (int i = 0; i < lines.size(); i++) {
                com.kb.ltt.domain.PayOrderLine line = lines.get(i);
                PayOrderLineEntity lineEntity = payOrderMapper.toLineEntity(line);
                lineEntity.setOrder(savedEntity);
                lineEntity.setLineNo(i + 1);
                lineEntity.setCreatedAt(line.getCreatedAt() != null ? line.getCreatedAt() : OffsetDateTime.now());
                lineJpaRepository.save(lineEntity);
            }
        }
    }

    private void saveApprovals(PayOrderEntity savedEntity, List<com.kb.ltt.domain.PayOrderApproval> approvals) {
        // Approvals are append-only: find existing count and only save new ones
        List<PayOrderApprovalEntity> existing = approvalJpaRepository.findByOrderIdOrderByStepNoAsc(savedEntity.getId());
        int existingCount = existing.size();

        if (approvals != null && approvals.size() > existingCount) {
            for (int i = existingCount; i < approvals.size(); i++) {
                com.kb.ltt.domain.PayOrderApproval approval = approvals.get(i);
                PayOrderApprovalEntity approvalEntity = payOrderMapper.toApprovalEntity(approval);
                approvalEntity.setOrder(savedEntity);
                approvalJpaRepository.save(approvalEntity);
            }
        }
    }

    private List<Predicate> buildPredicates(PayOrderSpecification spec, Root<PayOrderEntity> root, CriteriaBuilder cb) {
        List<Predicate> predicates = new ArrayList<>();

        if (spec.statuses() != null && !spec.statuses().isEmpty()) {
            List<String> statusNames = spec.statuses().stream().map(Enum::name).toList();
            predicates.add(root.get("status").in(statusNames));
        }
        if (spec.channel() != null) {
            predicates.add(cb.equal(root.get("channel"), spec.channel().name()));
        }
        if (spec.orderType() != null) {
            predicates.add(cb.equal(root.get("orderType"), spec.orderType()));
        }
        if (spec.kbnnId() != null) {
            predicates.add(cb.equal(root.get("kbnnId"), spec.kbnnId()));
        }
        if (spec.createdBy() != null) {
            predicates.add(cb.equal(root.get("createdBy"), spec.createdBy()));
        }
        if (spec.keyword() != null && !spec.keyword().isBlank()) {
            String pattern = "%" + spec.keyword().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("refNo")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("senderName")), pattern),
                    cb.like(cb.lower(root.get("receiverName")), pattern)
            ));
        }
        if (spec.paymentDateFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("paymentDate"), spec.paymentDateFrom()));
        }
        if (spec.paymentDateTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("paymentDate"), spec.paymentDateTo()));
        }
        if (spec.createdDateFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), spec.createdDateFrom().atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime()));
        }
        if (spec.createdDateTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), spec.createdDateTo().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toOffsetDateTime()));
        }

        return predicates;
    }
}
