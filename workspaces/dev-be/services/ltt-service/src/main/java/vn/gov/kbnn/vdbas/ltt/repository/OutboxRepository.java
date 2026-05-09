package vn.gov.kbnn.vdbas.ltt.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.gov.kbnn.vdbas.ltt.domain.entity.LttAudit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface OutboxRepository extends JpaRepository<LttAudit, Long> {

    Page<LttAudit> findByLttIdOrderByPerformedAtDesc(Long lttId, Pageable pageable);
}
