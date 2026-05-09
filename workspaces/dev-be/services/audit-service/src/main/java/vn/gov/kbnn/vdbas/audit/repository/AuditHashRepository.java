package vn.gov.kbnn.vdbas.audit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.gov.kbnn.vdbas.audit.domain.entity.AuditHash;

import java.util.Optional;

@Repository
public interface AuditHashRepository extends JpaRepository<AuditHash, Long> {

    Optional<AuditHash> findTopByLttIdOrderByCreatedAtDesc(Long lttId);

    boolean existsByAuditId(Long auditId);
}
