package com.kb.ltt.application;

import com.kb.ltt.domain.exception.BusinessRuleException;
import com.kb.ltt.port.in.LookupUseCase;
import com.kb.ltt.port.out.MasterDataLookup;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Lookup danh muc use case implementation.
 * Delegates to MasterDataLookup port.
 * Supports types: BANK, USER, DVQHNS, CURRENCY, COA.
 *
 * BDD coverage:
 * - bdd-08-lookup.md — Scenario 1: Lookup BANK by code/name
 * - bdd-08-lookup.md — Scenario 2: Lookup USER by role
 * - bdd-08-lookup.md — Scenario 3: Lookup DVQHNS by code
 * - bdd-08-lookup.md — Scenario 4: Lookup CURRENCY
 * - bdd-08-lookup.md — Scenario 5: Lookup COA by segment
 * - bdd-08-lookup.md — Scenario 6: Invalid lookup type
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LookupService implements LookupUseCase {

    private static final Set<String> VALID_TYPES = Set.of(
            "BANK", "USER", "DVQHNS", "CURRENCY", "COA"
    );

    private final MasterDataLookup masterDataLookup;

    /**
     * BDD: bdd-08-lookup.md — Scenario 1-5: Happy path — lookup by type and query
     * BDD: bdd-08-lookup.md — Scenario 6: Invalid lookup type
     */
    @Override
    @Transactional(readOnly = true)
    public List<LookupEntry> lookup(String type, String query) {
        // Validate type
        if (type == null || type.isBlank()) {
            throw new BusinessRuleException("MSG-ERR-LOOKUP-TYPE",
                    "Loai danh muc (type) la bat buoc.");
        }

        String normalizedType = type.toUpperCase().trim();

        if (!VALID_TYPES.contains(normalizedType)) {
            throw new BusinessRuleException("MSG-ERR-LOOKUP-TYPE",
                    "Loai danh muc khong hop le: " + type
                            + ". Cho phep: " + String.join(", ", VALID_TYPES));
        }

        // Delegate to master data lookup port
        String queryParam = (query != null && !query.isBlank()) ? query.trim() : "";
        List<Map<String, String>> results = masterDataLookup.lookup(normalizedType, queryParam);

        // Map to LookupEntry
        List<LookupEntry> entries = results.stream()
                .map(this::toLookupEntry)
                .collect(Collectors.toList());

        log.debug("Lookup: type={}, query={}, resultCount={}", normalizedType, queryParam, entries.size());

        return entries;
    }

    /**
     * Map master data result to LookupEntry.
     * Expects map keys: "code", "name", "extra" (optional).
     */
    private LookupEntry toLookupEntry(Map<String, String> entry) {
        return new LookupEntry(
                entry.getOrDefault("code", ""),
                entry.getOrDefault("name", ""),
                entry.getOrDefault("extra", null)
        );
    }
}
