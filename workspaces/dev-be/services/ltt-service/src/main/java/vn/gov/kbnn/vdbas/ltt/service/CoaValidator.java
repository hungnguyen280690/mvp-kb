package vn.gov.kbnn.vdbas.ltt.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;

/**
 * CoaValidator — kiem tra to hop COA segment chéo (BIZ-COA-CROSS, VAL-019).
 * Doi chieu voi DMHT.COA-MATRIX.
 */
@Slf4j
@Service
public class CoaValidator {

    /**
     * Validate to hop COA cho LTT.
     * Kiem tra 11 segment: fundCode, naturalAccount, dvqhns, budgetLevel,
     * chapter, economicSector, ndkt, area, program, fundSource, treasury, reserve.
     *
     * @param ltt entity LTT can validate
     * @return true neu hop le, false neu khong
     */
    public boolean validateCoaCombination(Ltt ltt) {
        // TODO: Trien khai thuc te — goi DMHT.COA-MATRIX lookup
        // Hien tai luon tra ve true (MVP)
        log.debug("COA validation for LTT: {}", ltt.getSoYctt());
        return true;
    }
}
