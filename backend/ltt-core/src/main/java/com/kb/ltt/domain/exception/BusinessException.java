package com.kb.ltt.domain.exception;

/**
 * Base domain exception carrying a §A9-style error code (e.g. "MSG-ERR-LOCK").
 * Must remain free of any Spring / JPA imports.
 */
public class BusinessException extends RuntimeException {

    private final String code;

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
