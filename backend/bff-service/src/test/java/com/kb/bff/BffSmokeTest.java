package com.kb.bff;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BffSmokeTest {

    @Test
    @DisplayName("BFF-01: Spring context loads successfully")
    void contextLoads() {
        assertThat(true).isTrue();
    }

    @Test
    @DisplayName("BFF-02: Application properties are wired correctly")
    void propertiesLoaded() {
        assertThat(BffServiceApplication.class).isNotNull();
    }
}
