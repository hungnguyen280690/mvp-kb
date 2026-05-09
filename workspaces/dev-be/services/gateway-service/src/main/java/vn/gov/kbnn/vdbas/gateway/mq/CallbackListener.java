package vn.gov.kbnn.vdbas.gateway.mq;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Callback listener — lang nghe tren ACK queues tu NHNN/NHTM/LKB.
 * Xu ly callback va goi ltt-service de cap nhat trang thai.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CallbackListener {

    /**
     * Lang nghe callback tu LNH (NHNN/CITAD).
     */
    @JmsListener(destination = "LNH.ACK.Q")
    public void onLnhCallback(String message) {
        log.info("Received LNH callback: messageLength={}", message.length());
        processCallback("LNH", message);
    }

    /**
     * Lang nghe callback tu SP (NHTM).
     */
    @JmsListener(destination = "SP.ACK.Q")
    public void onSpCallback(String message) {
        log.info("Received SP callback: messageLength={}", message.length());
        processCallback("SP", message);
    }

    /**
     * Lang nghe callback tu LKB (Lien kho bac).
     */
    @JmsListener(destination = "LKB.ACK.Q")
    public void onLkbCallback(String message) {
        log.info("Received LKB callback: messageLength={}", message.length());
        processCallback("LKB", message);
    }

    private void processCallback(String channel, String message) {
        // TODO: Parse message, validate HMAC, call ltt-service callback API
        log.info("Processing {} callback", channel);
    }
}
