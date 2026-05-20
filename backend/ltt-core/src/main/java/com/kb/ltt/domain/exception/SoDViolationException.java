package com.kb.ltt.domain.exception;

/**
 * Thrown when a Segregation of Duties (SoD) rule is violated.
 * Code: MSG-ERR-PERMISSION
 */
public class SoDViolationException extends BusinessException {

    public SoDViolationException(String message) {
        super("MSG-ERR-PERMISSION", message);
    }
}
