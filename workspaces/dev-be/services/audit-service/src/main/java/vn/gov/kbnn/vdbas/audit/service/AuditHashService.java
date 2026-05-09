package vn.gov.kbnn.vdbas.audit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.gov.kbnn.vdbas.audit.domain.entity.AuditHash;
import vn.gov.kbnn.vdbas.audit.repository.AuditHashRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;

/**
 * AuditHashService — quan ly chuoi hash kiem toan (ADR-0003).
 * hash_truoc + du lieu + thoi_gian -> SHA-256.
 * Chong sua lui du lieu.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditHashService {

    private final AuditHashRepository auditHashRepository;

    /**
     * Tinh va luu hash cho mot audit entry.
     *
     * @param lttId        ID cua LTT
     * @param auditId      ID cua audit entry
     * @param auditData    du lieu audit (JSON)
     * @return AuditHash da duoc luu
     */
    @Transactional
    public AuditHash computeAndSave(Long lttId, Long auditId, String auditData) {
        // Lay hash truoc do
        String previousHash = auditHashRepository
                .findTopByLttIdOrderByCreatedAtDesc(lttId)
                .map(AuditHash::getCurrentHash)
                .orElse("GENESIS");

        // Tinh hash moi
        String currentHash = computeHash(previousHash, auditData, OffsetDateTime.now());

        AuditHash auditHash = AuditHash.builder()
                .lttId(lttId)
                .auditId(auditId)
                .previousHash(previousHash)
                .currentHash(currentHash)
                .createdAt(OffsetDateTime.now())
                .build();

        return auditHashRepository.save(auditHash);
    }

    /**
     * Verify toan bo chuoi hash cho mot LTT.
     *
     * @param lttId ID cua LTT can verify
     * @return true neu chuoi hash hop le
     */
    @Transactional(readOnly = true)
    public boolean verifyHashChain(Long lttId) {
        var hashes = auditHashRepository.findAll().stream()
                .filter(h -> h.getLttId().equals(lttId))
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .toList();

        String expectedPrevious = "GENESIS";
        for (AuditHash hash : hashes) {
            if (!expectedPrevious.equals(hash.getPreviousHash())) {
                log.error("Hash chain broken at auditId={} for lttId={}", hash.getAuditId(), lttId);
                return false;
            }
            expectedPrevious = hash.getCurrentHash();
        }
        return true;
    }

    private String computeHash(String previousHash, String data, OffsetDateTime timestamp) {
        try {
            String input = previousHash + "|" + data + "|" + timestamp.toString();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
