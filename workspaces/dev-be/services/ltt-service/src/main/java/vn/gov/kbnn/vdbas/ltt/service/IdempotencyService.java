package vn.gov.kbnn.vdbas.ltt.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.gov.kbnn.vdbas.ltt.repository.LttRepository;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * IdempotencyService — theo doi idempotency key cho moi REST POST (ADR-0005).
 * Dam bao cung key chi xu ly 1 lan.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final LttRepository lttRepository;

    // Cache in-memory cho idempotency (production: Redis)
    private final Map<String, Long> keyCache = new ConcurrentHashMap<>();

    /**
     * Kiem tra xem idempotency key da duoc xu ly chua.
     * @return ID cua LTT da xu ly neu co, null neu chua.
     */
    public Long checkAndTrack(String idempotencyKey) {
        if (idempotencyKey == null) return null;

        // Kiem tra cache
        Long existingId = keyCache.get(idempotencyKey);
        if (existingId != null) {
            return existingId;
        }

        // Kiem tra DB
        return lttRepository.findByIdempotencyKey(idempotencyKey)
                .map(ltt -> {
                    keyCache.put(idempotencyKey, ltt.getId());
                    return ltt.getId();
                })
                .orElse(null);
    }

    /**
     * Ghi nhan idempotency key da duoc xu ly.
     */
    public void track(String idempotencyKey, Long lttId) {
        if (idempotencyKey != null) {
            keyCache.put(idempotencyKey, lttId);
        }
    }
}
