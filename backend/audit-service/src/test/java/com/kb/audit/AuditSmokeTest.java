package com.kb.audit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AuditSmokeTest {

    @Test
    @DisplayName("AUDIT-01: Spring context loads successfully")
    void contextLoads() {
        assertThat(true).isTrue();
    }

    @Test
    @DisplayName("AUDIT-02: Application class is present")
    void applicationClassPresent() {
        assertThat(AuditServiceApplication.class).isNotNull();
    }
}
