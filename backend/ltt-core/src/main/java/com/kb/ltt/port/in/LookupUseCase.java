package com.kb.ltt.port.in;

import java.util.List;

/**
 * Use case: Tra cuu danh muc (popup lookup).
 * Loai: BANK, USER, DVQHNS, CURRENCY, COA.
 */
public interface LookupUseCase {

    List<LookupEntry> lookup(String type, String query);

    /**
     * Entry tra ve tu lookup.
     */
    record LookupEntry(
            String code,
            String name,
            String extra           // Thong tin bo sung tuy loai (vd: bankCode, address...)
    ) {}
}
