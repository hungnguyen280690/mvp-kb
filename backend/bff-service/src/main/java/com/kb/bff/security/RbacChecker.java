package com.kb.bff.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Role-Based Access Control checker.
 * Maps JWT roles to permission codes and checks if the current user
 * has a required permission for a given operation.
 * <p>
 * Role-to-permission mapping:
 * <ul>
 *   <li>MAKER -> CREATE, READ, UPDATE, DELETE, SUBMIT</li>
 *   <li>CHECKER -> CHECK, RETURN, REJECT, READ</li>
 *   <li>APPROVER -> APPROVE, RETURN, REJECT, READ</li>
 *   <li>VIEWER -> READ, EXPORT</li>
 * </ul>
 */
@Component
public class RbacChecker {

    private static final Map<String, Set<String>> ROLE_PERMISSIONS = Map.of(
            "MAKER", Set.of(
                    PermissionCodes.CREATE,
                    PermissionCodes.READ,
                    PermissionCodes.UPDATE,
                    PermissionCodes.DELETE,
                    PermissionCodes.SUBMIT
            ),
            "CHECKER", Set.of(
                    PermissionCodes.CHECK,
                    PermissionCodes.RETURN,
                    PermissionCodes.REJECT,
                    PermissionCodes.READ
            ),
            "APPROVER", Set.of(
                    PermissionCodes.APPROVE,
                    PermissionCodes.RETURN,
                    PermissionCodes.REJECT,
                    PermissionCodes.READ
            ),
            "VIEWER", Set.of(
                    PermissionCodes.READ,
                    PermissionCodes.EXPORT
            )
    );

    /**
     * Check if the currently authenticated user has the specified permission.
     * Throws AccessDeniedException if the user does not have the permission.
     *
     * @param permission the permission code to check (use constants from {@link PermissionCodes})
     * @throws AccessDeniedException if the user lacks the required permission
     */
    public void checkPermission(String permission) {
        if (!hasPermission(permission)) {
            throw new AccessDeniedException(
                    "Required permission: " + permission);
        }
    }

    /**
     * Returns true if the currently authenticated user has the specified permission.
     *
     * @param permission the permission code to check
     * @return true if the user has the permission, false otherwise
     */
    public boolean hasPermission(String permission) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        if (!(authentication instanceof JwtAuthToken jwtAuth)) {
            return false;
        }

        List<String> roles = jwtAuth.getRoles();

        return roles.stream()
                .anyMatch(role -> {
                    Set<String> permissions = ROLE_PERMISSIONS.get(role);
                    return permissions != null && permissions.contains(permission);
                });
    }
}
