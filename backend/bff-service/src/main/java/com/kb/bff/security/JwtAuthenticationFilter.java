package com.kb.bff.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.interfaces.RSAPublicKey;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * JWT authentication filter that validates Bearer tokens (RS256) on every request.
 * Extracts userId (sub), roles[], and kbnnId from JWT claims and sets them in
 * the SecurityContext as a {@link JwtAuthToken}.
 * <p>
 * Returns 401 JSON error for invalid or missing tokens on protected endpoints.
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JWTVerifier jwtVerifier;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(
            @Value("${jwt.public-key-path}") String publicKeyPath,
            ObjectMapper objectMapper
    ) {
        this.objectMapper = objectMapper;
        this.jwtVerifier = buildVerifier(publicKeyPath);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendUnauthorized(response, "Missing or invalid Authorization header");
            return;
        }

        String token = authHeader.substring(7);

        try {
            DecodedJWT decodedJWT = jwtVerifier.verify(token);

            String userId = decodedJWT.getSubject();
            List<String> roles = decodedJWT.getClaim("roles").asList(String.class);
            String kbnnId = decodedJWT.getClaim("kbnnId").asString();

            if (userId == null || userId.isBlank()) {
                sendUnauthorized(response, "Token missing subject (sub) claim");
                return;
            }

            JwtAuthToken auth = new JwtAuthToken(
                    userId,
                    roles != null ? roles : List.of(),
                    kbnnId,
                    token
            );

            SecurityContextHolder.getContext().setAuthentication(auth);
            filterChain.doFilter(request, response);

        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            sendUnauthorized(response, "Token expired or invalid: " + e.getMessage());
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Allow actuator endpoints without authentication
        return path.startsWith("/actuator");
    }

    /**
     * Send a 401 Unauthorized JSON response matching the openapi.yaml ErrorResponse schema.
     */
    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        Map<String, Object> errorBody = Map.of(
                "TRACE_ID", UUID.randomUUID().toString(),
                "TIMESTAMP", OffsetDateTime.now().toString(),
                "CODE", "MSG-ERR-AUTH",
                "MESSAGE", message
        );

        objectMapper.writeValue(response.getWriter(), errorBody);
    }

    /**
     * Build the JWT verifier using RS256 with the configured public key.
     * Supports both classpath: and filesystem paths.
     */
    private JWTVerifier buildVerifier(String publicKeyPath) {
        try {
            String pemContent;

            if (publicKeyPath.startsWith("classpath:")) {
                // Load from classpath resource
                String resourcePath = publicKeyPath.substring("classpath:".length());
                try (var is = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
                    if (is == null) {
                        throw new IllegalStateException("Classpath resource not found: " + resourcePath);
                    }
                    pemContent = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            } else {
                // Load from filesystem
                java.nio.file.Path path = java.nio.file.Paths.get(publicKeyPath);
                pemContent = java.nio.file.Files.readString(path);
            }

            // Strip PEM headers and decode base64
            String publicKeyPEM = pemContent
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");

            byte[] encoded = java.util.Base64.getDecoder().decode(publicKeyPEM);
            java.security.spec.X509EncodedKeySpec keySpec = new java.security.spec.X509EncodedKeySpec(encoded);
            java.security.KeyFactory keyFactory = java.security.KeyFactory.getInstance("RSA");
            RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(keySpec);

            return JWT.require(Algorithm.RSA256(publicKey, null))
                    .build();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load JWT public key from: " + publicKeyPath, e);
        }
    }
}
