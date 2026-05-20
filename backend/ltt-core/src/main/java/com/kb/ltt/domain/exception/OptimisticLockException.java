package com.kb.ltt.domain.exception;

import lombok.Getter;

/**
 * Nem ra khi F-VER (optimistic lock) khong khop - ADR-0004, VAL-15.
 * HTTP 409 MSG-ERR-LOCK.
 */
@Getter
public class OptimisticLockException extends RuntimeException {

    private final long currentVersion;
    private final long expectedVersion;

    public OptimisticLockException(long currentVersion, long expectedVersion) {
        super(String.format("Optimistic lock conflict: current version=%d, expected version=%d",
                currentVersion, expectedVersion));
        this.currentVersion = currentVersion;
        this.expectedVersion = expectedVersion;
    }
}
