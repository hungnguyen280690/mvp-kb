package vn.gov.kbnn.vdbas.ltt.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;

/**
 * FundReserveService — dat giu va giai phong quy (BIZ-RESERVE-FUND, BIZ-RELEASE-HOLD).
 */
@Slf4j
@Service
public class FundReserveService {

    /**
     * Dat giu quy khi Submit (BIZ-RESERVE-FUND).
     * Hold so du kha dung = So tien LTT.
     */
    public void reserveFund(Ltt ltt) {
        // TODO: Goi Core Account API de hold so du
        log.info("Reserve fund for LTT {}: amount={} {}", ltt.getSoYctt(), ltt.getAmount(), ltt.getCurrency());
    }

    /**
     * Release hold khi Reject/Cancel/Delete (BIZ-RELEASE-HOLD).
     */
    public void releaseHold(Ltt ltt) {
        // TODO: Goi Core Account API de release hold
        log.info("Release hold for LTT {}: amount={} {}", ltt.getSoYctt(), ltt.getAmount(), ltt.getCurrency());
    }
}
