package com.kb.ltt.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * JWT authentication filter (MVP phase — no signature verification).
 *
 * <p>In production phase the BFF service validates the JWT signature.
 * Here we only base64-decode the payload to extract claims.</p>
 *
 * <p>Dev profile bypass: if no Authorization header is present the filter
 * accepts {@code X-Dev-User-Id}, {@code X-Dev-Roles}, and {@code X-Dev-Kbnn-Id}
 * headers to allow local testing without a real IdP.</p>
 */
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String DEV_USER_HEADER  = "X-Dev-User-Id";
    private static final String DEV_ROLES_HEADER = "X-Dev-Roles";
    private static final String DEV_KBNN_HEADER  = "X-Dev-Kbnn-Id";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
                // Parse JWT without signature verification (MVP)
                String token = authHeader.substring(BEARER_PREFIX.length()).trim();
                authenticateFromJwt(token);

            } else if (isDevProfile()) {
                // Dev bypass: accept plain headers
                authenticateFromDevHeaders(request);
            }
            // If neither present: leave SecurityContext unauthenticated → Spring Security will 403
        } catch (Exception ex) {
            log.warn("JWT auth filter error: {}", ex.getMessage());
            // Do not short-circuit; let Spring Security handle the unauthenticated request
        }

        filterChain.doFilter(request, response);
    }

    // ── JWT parsing ───────────────────────────────────────────────────────

    private void authenticateFromJwt(String token) {
        // JWT structure: <header>.<payload>.<signature>
        String[] parts = token.split("\\.");
        if (parts.length < 2) {
            log.warn("Malformed JWT token (less than 2 parts)");
            return;
        }

        String payloadJson = new String(
                Base64.getUrlDecoder().decode(padBase64(parts[1])),
                StandardCharsets.UTF_8);

        String userId = extractClaim(payloadJson, "sub");
        String kbnnId = extractClaim(payloadJson, "kbnnId");
        List<String> roles = extractRolesFromPayload(payloadJson);

        if (userId == null) {
            log.warn("JWT payload missing 'sub' claim");
            return;
        }

        setAuthentication(userId, kbnnId, roles);
    }

    private void authenticateFromDevHeaders(HttpServletRequest request) {
        String userId = request.getHeader(DEV_USER_HEADER);
        if (userId == null || userId.isBlank()) return;

        String kbnnId = request.getHeader(DEV_KBNN_HEADER);
        String rolesHeader = request.getHeader(DEV_ROLES_HEADER);
        List<String> roles = (rolesHeader != null && !rolesHeader.isBlank())
                ? Arrays.asList(rolesHeader.split(","))
                : Collections.emptyList();

        log.debug("Dev auth bypass: userId={} kbnnId={} roles={}", userId, kbnnId, roles);
        setAuthentication(userId, kbnnId, roles);
    }

    private void setAuthentication(String userId, String kbnnId, List<String> roles) {
        List<SimpleGrantedAuthority> authorities = roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.trim().toUpperCase()))
                .toList();

        // Store kbnnId as details on the token for downstream use
        var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
        auth.setDetails(Map.of("kbnnId", kbnnId != null ? kbnnId : ""));

        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Very simple JSON claim extractor — avoids pulling in a JWT library for MVP.
     * Handles {@code "key":"value"} and {@code "key":number} patterns.
     */
    static String extractClaim(String json, String key) {
        String pattern1 = "\"" + key + "\":\"";
        int idx = json.indexOf(pattern1);
        if (idx >= 0) {
            int start = idx + pattern1.length();
            int end = json.indexOf("\"", start);
            return end > start ? json.substring(start, end) : null;
        }
        // Try numeric claim
        String pattern2 = "\"" + key + "\":";
        idx = json.indexOf(pattern2);
        if (idx >= 0) {
            int start = idx + pattern2.length();
            int end = json.indexOf(",", start);
            if (end < 0) end = json.indexOf("}", start);
            return end > start ? json.substring(start, end).trim() : null;
        }
        return null;
    }

    /** Extract roles from a "roles":["ROLE_A","ROLE_B"] JSON array claim. */
    static List<String> extractRolesFromPayload(String json) {
        String marker = "\"roles\":[";
        int idx = json.indexOf(marker);
        if (idx < 0) return Collections.emptyList();
        int start = idx + marker.length();
        int end = json.indexOf("]", start);
        if (end < 0) return Collections.emptyList();
        String arrayContent = json.substring(start, end);
        return Arrays.stream(arrayContent.split(","))
                .map(s -> s.replace("\"", "").trim())
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private static String padBase64(String base64) {
        int pad = base64.length() % 4;
        if (pad == 2) return base64 + "==";
        if (pad == 3) return base64 + "=";
        return base64;
    }

    private boolean isDevProfile() {
        String active = System.getProperty("spring.profiles.active", "");
        if (active.contains("dev") || active.contains("test")) return true;
        active = System.getenv("SPRING_PROFILES_ACTIVE");
        return active != null && (active.contains("dev") || active.contains("test"));
    }
}
