package com.kb.ltt.infrastructure.persistence.adapter;

import com.kb.ltt.infrastructure.persistence.entity.RefNoSequenceEntity;
import com.kb.ltt.infrastructure.persistence.repository.RefNoSequenceJpaRepository;
import com.kb.ltt.port.out.RefNoGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RefNoGeneratorAdapter implements RefNoGenerator {

    private final RefNoSequenceJpaRepository jpaRepo;

    private static final DateTimeFormatter YM = DateTimeFormatter.ofPattern("yyyyMM");

    @Override
    @Transactional
    public String generate(String kbnnId) {
        String yearMonth = OffsetDateTime.now().format(YM);
        Optional<RefNoSequenceEntity> existing = jpaRepo.findWithLock(kbnnId, yearMonth);

        long seq;
        if (existing.isPresent()) {
            RefNoSequenceEntity entity = existing.get();
            seq = entity.getLastSeq() + 1;
            entity.setLastSeq(seq);
            entity.setUpdatedAt(OffsetDateTime.now());
            jpaRepo.save(entity);
        } else {
            seq = 1L;
            jpaRepo.save(RefNoSequenceEntity.builder()
                    .kbnnId(kbnnId)
                    .yearMonth(yearMonth)
                    .lastSeq(seq)
                    .updatedAt(OffsetDateTime.now())
                    .build());
        }

        return String.format("%s-%s-%06d", kbnnId, yearMonth, seq);
    }
}
