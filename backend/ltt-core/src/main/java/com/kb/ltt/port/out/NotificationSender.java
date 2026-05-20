package com.kb.ltt.port.out;

import java.util.Map;

/**
 * Outbound port: Gui notification (in-app + email stub).
 * BIZ-009.
 */
public interface NotificationSender {

    /**
     * Send notification to user.
     *
     * @param userId           user nhan
     * @param notificationType loai notification (ORDER_SUBMITTED, ORDER_APPROVED, ORDER_RETURNED, ORDER_REJECTED)
     * @param payload          du lieu kem theo (order info, reason, etc.)
     */
    void send(String userId, String notificationType, Map<String, Object> payload);
}
