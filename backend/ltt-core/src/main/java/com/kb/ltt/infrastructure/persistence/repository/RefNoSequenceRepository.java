package com.kb.ltt.infrastructure.persistence.repository;

import com.kb.ltt.infrastructure.persistence.entity.RefNoSequenceEntity;
import com.kb.ltt.infrastructure.persistence.entity.RefNoSequenceId;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefNoSequenceRepository extends JpaRepository<RefNoSequenceEntity, RefNoSequenceId> {

    /**
     * Pessimistic write lock on the sequence row to serialize concurrent REF_NO generation
     * for the same (KBNN, YYYYMM) bucket.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RefNoSequenceEntity r WHERE r.id.kbnnId = :kbnnId AND r.id.yearMonth = :yearMonth")
    Optional<RefNoSequenceEntity> findByKbnnIdAndYearMonthWithLock(
            @Param("kbnnId") String kbnnId,
            @Param("yearMonth") String yearMonth);
}
