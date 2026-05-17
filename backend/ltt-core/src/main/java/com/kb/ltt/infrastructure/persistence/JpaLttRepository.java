package com.kb.ltt.infrastructure.persistence;

import com.kb.ltt.domain.model.LttDetail;
import com.kb.ltt.domain.model.LttHeader;
import com.kb.ltt.domain.model.LttReceiver;
import com.kb.ltt.domain.model.LttSender;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository interfaces for LTT entities.
 * These are raw JPA repositories used by the LttRepositoryImpl adapter.
 *
 * // FT-001: JPA repository interfaces
 */
public final class JpaLttRepository {

    private JpaLttRepository() {
        // Utility class - prevent instantiation
    }

    /**
     * JPA repository for LttHeader with Specification support for dynamic queries.
     */
    @Repository
    public interface LttHeaderJpaRepository
            extends JpaRepository<LttHeader, Long>, JpaSpecificationExecutor<LttHeader> {

        Optional<LttHeader> findByIdempotencyKey(String idempotencyKey);
    }

    /**
     * JPA repository for LttDetail.
     */
    @Repository
    public interface LttDetailJpaRepository extends JpaRepository<LttDetail, Long> {

        List<LttDetail> findByLttIdOrderByLineNoAsc(Long lttId);

        void deleteByLttId(Long lttId);
    }

    /**
     * JPA repository for LttSender.
     */
    @Repository
    public interface LttSenderJpaRepository extends JpaRepository<LttSender, Long> {

        Optional<LttSender> findByLttId(Long lttId);
    }

    /**
     * JPA repository for LttReceiver.
     */
    @Repository
    public interface LttReceiverJpaRepository extends JpaRepository<LttReceiver, Long> {

        Optional<LttReceiver> findByLttId(Long lttId);
    }
}
