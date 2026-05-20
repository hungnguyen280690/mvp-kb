package com.kb.ltt.infrastructure.notification;

import com.kb.ltt.port.out.NotificationSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
public class LoggingNotificationSender implements NotificationSender {

    @Override
    public void send(String userId, String notificationType, Map<String, Object> payload) {
        log.info("Notification sent: type={}, userId={}, payload={}", notificationType, userId, payload);
    }
}
