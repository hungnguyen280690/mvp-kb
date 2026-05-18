package com.kb.ltt.infrastructure.persistence;

import com.kb.ltt.domain.model.LttReceiver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LttReceiverJpaRepository extends JpaRepository<LttReceiver, Long> {

    Optional<LttReceiver> findByLttId(Long lttId);
}
