package com.kb.ltt.infrastructure.persistence;

import com.kb.ltt.domain.model.LttDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LttDetailJpaRepository extends JpaRepository<LttDetail, Long> {

    List<LttDetail> findByLttIdOrderByLineNoAsc(Long lttId);

    void deleteByLttId(Long lttId);
}
