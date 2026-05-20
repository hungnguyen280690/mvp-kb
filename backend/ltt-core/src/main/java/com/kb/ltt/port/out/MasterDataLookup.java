package com.kb.ltt.port.out;

import java.util.List;
import java.util.Map;

/**
 * Outbound port: Lookup danh muc tu master-data-service.
 * Loai: BANK, USER, DVQHNS, CURRENCY, COA.
 */
public interface MasterDataLookup {

    /**
     * Lookup danh muc theo type va query.
     *
     * @param type  loai danh muc (BANK, USER, DVQHNS, CURRENCY, COA)
     * @param query tu khoa tim kiem
     * @return danh sach ket qua
     */
    List<Map<String, String>> lookup(String type, String query);
}
