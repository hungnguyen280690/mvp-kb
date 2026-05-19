package com.kb.ltt.domain.exception;

import lombok.Getter;

/**
 * Nem ra khi vi pham business rule nghiep vu.
 * Ma ruleCode tuong ung voi cac ma trong spec: VAL-xx, BIZ-xxx.
 */
@Getter
public class BusinessRuleException extends RuntimeException {

    private final String ruleCode;

    public BusinessRuleException(String ruleCode, String message) {
        super(String.format("[%s] %s", ruleCode, message));
        this.ruleCode = ruleCode;
    }
}
