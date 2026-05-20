package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.RefNoSequenceEntity;
import com.kb.ltt.infrastructure.persistence.entity.RefNoSequenceEntity.RefNoSequenceId;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository cho RefNoSequenceEntity.
 * Dung pessimistic lock (SELECT FOR UPDATE) de dam bao atomic increment.
 * INC-G-02.
 */
@Repository
public interface RefNoSequenceJpaRepository extends JpaRepository<RefNoSequenceEntity, RefNoSequenceId> {

    /**
     * Find with pessimistic write lock for atomic increment.
     * Tuong duong: SELECT ... FOR UPDATE
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RefNoSequenceEntity r WHERE r.kbnnId = :kbnnId AND r.yearMonth = :yearMonth")
    Optional<RefNoSequenceEntity> findWithLock(@Param("kbnnId") String kbnnId, @Param("yearMonth") String yearMonth);
}
