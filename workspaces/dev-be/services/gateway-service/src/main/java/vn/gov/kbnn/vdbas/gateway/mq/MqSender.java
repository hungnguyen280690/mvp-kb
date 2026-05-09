package vn.gov.kbnn.vdbas.gateway.mq;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

/**
 * MQ Sender — gui message vao IBM MQ queues.
 * Ho tro 3 kenh: LNH, SP, LKB.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MqSender {

    private final JmsTemplate jmsTemplate;

    /**
     * Gui message vao hang doi tuong ung.
     *
     * @param channel    kenh (LNH, SP, LKB)
     * @param queueName  ten queue
     * @param message    noi dung message (JSON)
     */
    public void send(String channel, String queueName, String message) {
        log.info("Sending to MQ: channel={}, queue={}, messageLength={}", channel, queueName, message.length());
        try {
            jmsTemplate.convertAndSend(queueName, message);
            log.info("Message sent successfully to queue: {}", queueName);
        } catch (Exception e) {
            log.error("Failed to send message to queue: {}", queueName, e);
            throw new RuntimeException("MQ send failed", e);
        }
    }

    /**
     * Gui message vao DLQ.
     */
    public void sendToDlq(String message) {
        send("DLQ", "TT.OUT.MANUAL.DLQ", message);
    }
}
