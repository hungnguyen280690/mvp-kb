package com.kb.ltt.infrastructure.persistence.adapter;

import com.kb.ltt.infrastructure.persistence.entity.AuditLogEntity;
import com.kb.ltt.infrastructure.persistence.mapper.AuditLogMapper;
import com.kb.ltt.infrastructure.persistence.repository.AuditLogJpaRepository;
import com.kb.ltt.port.out.AuditLogRepository;
import com.kb.ltt.port.out.AuditLogRepository.AuditLogEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Adapter: Implements AuditLogRepository port using JPA infrastructure.
 */
@Component
@RequiredArgsConstructor
public class AuditLogRepositoryAdapter implements AuditLogRepository {

    private final AuditLogJpaRepository auditLogJpaRepository;
    private final AuditLogMapper auditLogMapper;

    @Override
    @Transactional
    public void save(AuditLogEntry entry) {
        AuditLogEntity entity = auditLogMapper.toEntity(entry);
        if (entity.getId() == null) entity.setId(System.currentTimeMillis());
        if (entity.getEntityType() == null) entity.setEntityType("PAY_ORDER");
        if (entity.getAction() == null) entity.setAction("CREATE");
        if (entity.getPerformedBy() == null) entity.setPerformedBy("system");
        if (entity.getPerformedAt() == null) entity.setPerformedAt(java.time.OffsetDateTime.now());
        if (entity.getHash() == null) entity.setHash("dev-placeholder-hash");
        if (entity.getPrevHash() == null) entity.setPrevHash("0000000000000000");
        auditLogJpaRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogEntry> findByEntityId(String entityType, String entityId) {
        return auditLogJpaRepository.findByEntityTypeAndEntityIdOrderByPerformedAtDesc(entityType, entityId)
                .stream()
                .map(auditLogMapper::toDomain)
                .toList();
    }
}
