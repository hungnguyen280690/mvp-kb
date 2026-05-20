package com.kb.ltt.infrastructure.service;

import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.repository.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for AuditHashChainService using H2 in-memory DB.
 */
@DisplayName("AuditHashChainService — integration")
class AuditHashChainServiceTest extends BaseIntegrationTest {

    @Autowired
    AuditHashChainService auditHashChainService;

    @Autowired
    AuditLogRepository auditLogRepository;

    @Test
    @DisplayName("first record uses GENESIS_SALT as prevHash source")
    void firstRecord_usesGenesisSalt() {
        String entityId = java.util.UUID.randomUUID().toString();

        auditHashChainService.record(
                "PAY_ORDER", entityId, "CREATE",
                "user-001", "127.0.0.1",
                null, 1L, "{\"id\":\"" + entityId + "\"}");

        var entries = auditLogRepository.findByEntityIdOrderByPerformedAt(entityId,
                org.springframework.data.domain.Pageable.unpaged());

        assertThat(entries).hasSize(1);
        var entry = entries.get(0);

        // prevHash stored as null in DB for genesis (see service impl)
        assertThat(entry.getPrevHash()).isNull();
        assertThat(entry.getHash()).isNotNull().hasSize(64);
    }

    @Test
    @DisplayName("second record uses hash of first record as prevHash")
    void secondRecord_chainsToPrevHash() {
        String entityId = java.util.UUID.randomUUID().toString();

        auditHashChainService.record("PAY_ORDER", entityId, "CREATE",
                "user-001", "127.0.0.1", null, 1L, "{\"status\":\"DRAFT\"}");

        auditHashChainService.record("PAY_ORDER", entityId, "SUBMIT",
                "user-001", "127.0.0.1", 1L, 2L, "{\"status\":\"READY_FOR_APPROVAL\"}");

        var entries = auditLogRepository.findByEntityIdOrderByPerformedAt(entityId,
                org.springframework.data.domain.Pageable.unpaged());

        assertThat(entries).hasSize(2);
        String firstHash = entries.get(0).getHash();
        String secondPrevHash = entries.get(1).getPrevHash();

        assertThat(secondPrevHash).isEqualTo(firstHash);
        assertThat(entries.get(1).getHash()).isNotNull().hasSize(64);
    }

    @Test
    @DisplayName("hash is a 64-character hex string")
    void hash_is64HexChars() {
        String entityId = java.util.UUID.randomUUID().toString();

        auditHashChainService.record("PAY_ORDER", entityId, "CREATE",
                "user-002", "10.0.0.1", null, 1L, null);

        var entry = auditLogRepository.findTopByEntityIdOrderByPerformedAtDesc(entityId);

        assertThat(entry).isPresent();
        assertThat(entry.get().getHash())
                .isNotNull()
                .matches("[0-9a-f]{64}");
    }
}
