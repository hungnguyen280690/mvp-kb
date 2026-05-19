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
