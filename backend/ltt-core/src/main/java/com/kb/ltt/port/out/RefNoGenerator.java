package com.kb.ltt.port.out;

/**
 * Outbound port: Sinh REF_NO theo pattern <KBNN>-YYYYMM-<seq6>.
 * INC-G-02.
 */
public interface RefNoGenerator {

    /**
     * Generate next REF_NO.
     *
     * @param kbnnId ma KBNN (prefix)
     * @return REF_NO string, vd: "07101-202605-000001"
     */
    String generate(String kbnnId);
}
