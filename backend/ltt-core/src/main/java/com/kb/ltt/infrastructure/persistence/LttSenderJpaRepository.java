package com.kb.ltt.infrastructure.persistence;

import com.kb.ltt.domain.model.LttSender;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LttSenderJpaRepository extends JpaRepository<LttSender, Long> {

    Optional<LttSender> findByLttId(Long lttId);
}
