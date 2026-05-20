package com.kb.ltt.domain.exception;

/**
 * Thrown when a concurrent update is detected via optimistic locking.
 * Code: MSG-ERR-LOCK
 */
public class OptimisticLockException extends BusinessException {

    private final long yourVersion;
    private final long currentVersion;

    public OptimisticLockException(long yourVersion, long currentVersion) {
        super("MSG-ERR-LOCK",
                String.format("Optimistic lock conflict: your version=%d, current version=%d",
                        yourVersion, currentVersion));
        this.yourVersion = yourVersion;
        this.currentVersion = currentVersion;
    }

    public long getYourVersion() {
        return yourVersion;
    }

    public long getCurrentVersion() {
        return currentVersion;
    }
}
