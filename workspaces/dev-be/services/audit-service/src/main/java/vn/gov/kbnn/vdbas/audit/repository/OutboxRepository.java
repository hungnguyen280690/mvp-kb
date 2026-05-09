package vn.gov.kbnn.vdbas.audit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.gov.kbnn.vdbas.audit.domain.entity.OutboxEvent;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {

    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(String status);

    @Modifying
    @Query("UPDATE OutboxEvent e SET e.status = 'PUBLISHED', e.publishedAt = :publishedAt WHERE e.id = :id")
    void markAsPublished(Long id, OffsetDateTime publishedAt);

    @Modifying
    @Query("UPDATE OutboxEvent e SET e.retryCount = e.retryCount + 1, e.status = 'PENDING' WHERE e.id = :id")
    void incrementRetryCount(Long id);
}
