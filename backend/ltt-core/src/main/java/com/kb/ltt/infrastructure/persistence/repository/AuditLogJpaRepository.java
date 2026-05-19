package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.AuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho AuditLogEntity.
 */
@Repository
public interface AuditLogJpaRepository extends JpaRepository<AuditLogEntity, Long> {

    List<AuditLogEntity> findByEntityTypeAndEntityIdOrderByPerformedAtDesc(String entityType, String entityId);

    Optional<AuditLogEntity> findTopByEntityTypeAndEntityIdOrderByPerformedAtDesc(String entityType, String entityId);
}
