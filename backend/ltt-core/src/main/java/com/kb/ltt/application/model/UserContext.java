package com.kb.ltt.application.model;

import java.util.List;

/**
 * Immutable value object representing the authenticated user's context.
 * Populated from JWT claims in JwtAuthFilter.
 */
public record UserContext(String userId, List<String> roles, String kbnnId, String ipAddress) {

    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }

    public boolean isMaker() {
        return hasRole("PAY_OUT_MAKER");
    }

    public boolean isChecker() {
        return hasRole("PAY_OUT_CHECKER");
    }

    public boolean isApprover() {
        return hasRole("PAY_OUT_APPROVER");
    }
}
