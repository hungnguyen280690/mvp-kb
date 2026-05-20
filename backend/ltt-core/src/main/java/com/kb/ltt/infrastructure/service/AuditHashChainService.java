package com.kb.ltt.infrastructure.service;

import com.kb.ltt.infrastructure.persistence.entity.AuditLogEntity;
import com.kb.ltt.infrastructure.persistence.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Maintains the append-only SHA-256 hash chain for LTT_AUDIT_LOG (ADR-0003).
 *
 * <p>Hash formula:
 * {@code SHA-256(prevHash + entityType + entityId + action + userId + performedAtMicros + payloadJson + ipAddress)}
 * </p>
 *
 * <p>The first entry for a given entityId uses {@link #GENESIS_SALT} as prevHash.</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuditHashChainService {

    public static final String GENESIS_SALT = "VDBAS-AUDIT-GENESIS-2026";

    private final AuditLogRepository auditLogRepository;

    /**
     * Record a new audit event and persist it with the chained hash.
     *
     * @param entityType    e.g. "PAY_ORDER"
     * @param entityId      UUID of the affected entity
     * @param action        e.g. "CREATE", "SUBMIT", "APPROVE"
     * @param performedBy   user ID of the actor
     * @param ipAddress     client IP address
     * @param versionBefore entity version before action (null for CREATE)
     * @param versionAfter  entity version after action
     * @param payloadJson   JSON snapshot of the entity
     */
    @Transactional
    public void record(String entityType,
                       String entityId,
                       String action,
                       String performedBy,
                       String ipAddress,
                       Long versionBefore,
                       Long versionAfter,
                       String payloadJson) {

        Instant now = Instant.now();

        // Resolve previous hash (chain anchor)
        String prevHash = auditLogRepository
                .findTopByEntityIdOrderByPerformedAtDesc(entityId)
                .map(AuditLogEntity::getHash)
                .orElse(GENESIS_SALT);

        // Compute this entry's hash
        String hash = computeHash(prevHash, entityType, entityId, action,
                performedBy, now, payloadJson, ipAddress);

        AuditLogEntity entry = AuditLogEntity.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .payload(payloadJson)
                .performedBy(performedBy)
                .performedAt(now)
                .ipAddress(ipAddress)
                .versionBefore(versionBefore)
                .versionAfter(versionAfter)
                .prevHash(prevHash.equals(GENESIS_SALT) ? null : prevHash)
                .hash(hash)
                .build();

        auditLogRepository.save(entry);
        log.debug("Audit recorded: entityId={} action={} hash={}", entityId, action, hash);
    }

    // ── Internals ─────────────────────────────────────────────────────────

    static String computeHash(String prevHash,
                               String entityType,
                               String entityId,
                               String action,
                               String userId,
                               Instant performedAt,
                               String payloadJson,
                               String ipAddress) {
        String raw = prevHash
                + entityType
                + entityId
                + action
                + userId
                + performedAt.toEpochMilli()
                + (payloadJson != null ? payloadJson : "")
                + (ipAddress != null ? ipAddress : "");
        return sha256Hex(raw);
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
