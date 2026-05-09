package vn.gov.kbnn.vdbas.gateway.config;

import org.springframework.context.annotation.Configuration;

/**
 * IBM MQ configuration cho Gateway Service.
 * Queue Manager: VDBAS.QM
 * Send queues: LNH.SEND.Q, SP.SEND.Q, LKB.SEND.Q
 * ACK queues: LNH.ACK.Q, SP.ACK.Q, LKB.ACK.Q
 */
@Configuration
public class MqConfig {
    // Connection factory and queue beans configured from application.yml
}
