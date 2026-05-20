package com.kb.ltt.domain.exception;

import lombok.Getter;

/**
 * Nem ra khi vi pham SoD (Segregation of Duties) - BIZ-001, INC-G-17.
 * HTTP 403 MSG-ERR-PERMISSION.
 */
@Getter
public class SoDViolationException extends RuntimeException {

    private final String userId;
    private final String conflictingRole;

    public SoDViolationException(String userId, String conflictingRole) {
        super(String.format("SoD violation: user '%s' cannot perform action as '%s' "
                + "- must be different from creator/previous actor", userId, conflictingRole));
        this.userId = userId;
        this.conflictingRole = conflictingRole;
    }
}
