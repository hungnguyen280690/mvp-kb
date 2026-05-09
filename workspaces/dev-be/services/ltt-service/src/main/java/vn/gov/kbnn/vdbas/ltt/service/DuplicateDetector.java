package vn.gov.kbnn.vdbas.ltt.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;
import vn.gov.kbnn.vdbas.ltt.repository.LttRepository;

import java.time.OffsetDateTime;

/**
 * DuplicateDetector — kiem tra trung LTT trong N phut (BIZ-DUPLICATE).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DuplicateDetector {

    private final LttRepository lttRepository;

    @Value("${vdbas.duplicate.window-minutes:5}")
    private int duplicateWindowMinutes;

    /**
     * Kiem tra xem LTT co bi trung voi LTT khac trong N phut gan nhat khong.
     * Cac tieu chi: cung Don vi, cung NH nhan, cung So tien, cung So CT goc.
     */
    public boolean isDuplicate(Ltt ltt) {
        OffsetDateTime since = OffsetDateTime.now().minusMinutes(duplicateWindowMinutes);
        long count = lttRepository.countDuplicateCandidates(
                ltt.getUnitCode(),
                ltt.getReceiverBankCode(),
                ltt.getAmount(),
                ltt.getOrigDocNo(),
                since);
        return count > 0;
    }
}
