package com.kb.bff.security;

import lombok.Getter;
import org.springframework.security.authentication.AbstractAuthenticationToken;

import java.util.List;

/**
 * JWT Authentication token holding user context extracted from JWT claims.
 * Used as the principal in Spring Security context after JWT validation.
 */
@Getter
public class JwtAuthToken extends AbstractAuthenticationToken {

    private final String userId;
    private final List<String> roles;
    private final String kbnnId;
    private final String token;

    public JwtAuthToken(String userId, List<String> roles, String kbnnId, String token) {
        super(roles.stream()
                .map(role -> (org.springframework.security.core.GrantedAuthority) () -> "ROLE_" + role)
                .toList());
        this.userId = userId;
        this.roles = roles;
        this.kbnnId = kbnnId;
        this.token = token;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return token;
    }

    @Override
    public Object getPrincipal() {
        return userId;
    }
}
