package com.kb.ltt.application.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Spring configuration for the ltt-core module.
 * Enables JPA auditing and transaction management.
 *
 * // FT-001: LTT Core module configuration
 */
@Configuration
@EnableJpaAuditing
@EnableTransactionManagement
public class LttCoreConfig {
}
