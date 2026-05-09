package vn.gov.kbnn.vdbas.ltt.config;

import org.springframework.context.annotation.Configuration;

/**
 * IBM MQ configuration — connection factory, queues, JMS listener.
 * Queue Manager: VDBAS.QM
 * Queues: TT.OUT.MANUAL.EVENTS.Q, LNH.SEND.Q, SP.SEND.Q, LKB.SEND.Q
 */
@Configuration
public class MqConfig {
    // IBM MQ connection factory and queue beans
    // Configured from application.yml spring.artemis.* properties
    // In production, replace Artemis with IBM MQ JMS provider
}
