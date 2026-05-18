package com.kb.ltt.infrastructure.persistence;

import com.kb.ltt.domain.model.LttHeader;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LttHeaderJpaRepository
        extends JpaRepository<LttHeader, Long>, JpaSpecificationExecutor<LttHeader> {

    Optional<LttHeader> findByIdempotencyKey(String idempotencyKey);
}
