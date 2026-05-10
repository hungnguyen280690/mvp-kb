package vn.gov.kbnn.vdbas.ltt.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Outbox;

@Repository
public interface OutboxRepository extends JpaRepository<Outbox, Long> {
}
