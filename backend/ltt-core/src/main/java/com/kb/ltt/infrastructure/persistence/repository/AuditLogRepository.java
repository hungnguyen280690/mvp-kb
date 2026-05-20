package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.AuditLogEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {

    /** Chronological audit trail for a given entity. */
    List<AuditLogEntity> findByEntityIdOrderByPerformedAt(String entityId, Pageable pageable);

    /** Latest entry for a given entity — used to fetch prevHash for next entry. */
    Optional<AuditLogEntity> findTopByEntityIdOrderByPerformedAtDesc(String entityId);
}
