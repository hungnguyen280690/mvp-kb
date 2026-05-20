package com.kb.ltt.infrastructure.web;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for PayOutManualController.
 * Uses H2 in-memory database (application-test.yml) and dev-bypass auth headers.
 *
 * JwtAuthFilter checks System.getProperty("spring.profiles.active") for dev/test
 * to enable X-Dev-* header bypass. We set it here in @BeforeAll.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PayOutManualControllerTest {

    @Autowired
    MockMvc mockMvc;

    private static final String MAKER_USER_ID = "user-001";
    private static final String MAKER_ROLE    = "PAY_OUT_MAKER";
    private static final String KBNN_ID       = "HN001";

    @BeforeAll
    static void enableDevBypass() {
        // JwtAuthFilter.isDevProfile() checks this system property.
        // @ActiveProfiles sets Spring context profiles but NOT the JVM system property.
        System.setProperty("spring.profiles.active", "test");
    }

    // ── Tests ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/pay-out-manual without X-Idempotency-Key returns 400")
    void createWithoutIdempotencyKey_returns400() throws Exception {
        mockMvc.perform(post("/api/pay-out-manual")
                        .header("X-Dev-User-Id", MAKER_USER_ID)
                        .header("X-Dev-Roles", MAKER_ROLE)
                        .header("X-Dev-Kbnn-Id", KBNN_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/pay-out-manual/{id} with non-existent ID returns 404")
    void getByNonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/pay-out-manual/non-existent-id-12345")
                        .header("X-Dev-User-Id", MAKER_USER_ID)
                        .header("X-Dev-Roles", MAKER_ROLE)
                        .header("X-Dev-Kbnn-Id", KBNN_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/pay-out-manual/lookup/CURRENCY returns 200 with content")
    void lookupCurrency_returns200WithContent() throws Exception {
        mockMvc.perform(get("/api/pay-out-manual/lookup/CURRENCY")
                        .header("X-Dev-User-Id", MAKER_USER_ID)
                        .header("X-Dev-Roles", MAKER_ROLE)
                        .header("X-Dev-Kbnn-Id", KBNN_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    @DisplayName("POST /api/pay-out-manual/{id}/validate-ccid returns 200 (no idempotency key needed)")
    void validateCcid_returns200() throws Exception {
        String body = """
                {
                  "segments": ["A","B","C","D","E","F","G","H","I","J","K","L"],
                  "lineNum": 1
                }
                """;

        mockMvc.perform(post("/api/pay-out-manual/some-order-id/validate-ccid")
                        .header("X-Dev-User-Id", MAKER_USER_ID)
                        .header("X-Dev-Roles", MAKER_ROLE)
                        .header("X-Dev-Kbnn-Id", KBNN_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true));
    }

    @Test
    @DisplayName("GET /api/pay-out-manual returns 200 with paged response (empty list)")
    void listPayOrders_returns200WithPagedResponse() throws Exception {
        mockMvc.perform(get("/api/pay-out-manual")
                        .header("X-Dev-User-Id", MAKER_USER_ID)
                        .header("X-Dev-Roles", MAKER_ROLE)
                        .header("X-Dev-Kbnn-Id", KBNN_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20));
    }

    @Test
    @DisplayName("GET /api/pay-out-manual without auth returns 403")
    void listWithoutAuth_returns403() throws Exception {
        mockMvc.perform(get("/api/pay-out-manual"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/pay-out-manual/{id} without X-Idempotency-Key returns 400")
    void updateWithoutIdempotencyKey_returns400() throws Exception {
        mockMvc.perform(put("/api/pay-out-manual/some-id")
                        .header("X-Dev-User-Id", MAKER_USER_ID)
                        .header("X-Dev-Roles", MAKER_ROLE)
                        .header("X-Dev-Kbnn-Id", KBNN_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/pay-out-manual/lookup/INVALID_TYPE_XYZ returns 422")
    void lookupInvalidType_returnsError() throws Exception {
        mockMvc.perform(get("/api/pay-out-manual/lookup/INVALID_TYPE_XYZ")
                        .header("X-Dev-User-Id", MAKER_USER_ID)
                        .header("X-Dev-Roles", MAKER_ROLE)
                        .header("X-Dev-Kbnn-Id", KBNN_ID))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("MSG-ERR-LOOKUP-TYPE"));
    }

    @Test
    @DisplayName("POST /api/pay-out-manual/{id}/validate-ccid with incomplete segments returns valid=false")
    void validateCcidIncomplete_returnsInvalid() throws Exception {
        String body = """
                {
                  "segments": ["A","B"],
                  "lineNum": 1
                }
                """;

        mockMvc.perform(post("/api/pay-out-manual/some-order-id/validate-ccid")
                        .header("X-Dev-User-Id", MAKER_USER_ID)
                        .header("X-Dev-Roles", MAKER_ROLE)
                        .header("X-Dev-Kbnn-Id", KBNN_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false))
                .andExpect(jsonPath("$.errors").isArray());
    }
}
