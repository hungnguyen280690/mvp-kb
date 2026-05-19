package com.kb.bff.security;

/**
 * Permission code constants for FT-001 PAY.OUT.MANUAL.
 * Each constant maps to a specific API operation in the openapi.yaml security section.
 */
public final class PermissionCodes {

    private PermissionCodes() {
        // prevent instantiation
    }

    public static final String CREATE = "PAY.OUT.MANUAL.CREATE";
    public static final String READ = "PAY.OUT.MANUAL.READ";
    public static final String UPDATE = "PAY.OUT.MANUAL.UPDATE";
    public static final String DELETE = "PAY.OUT.MANUAL.DELETE";
    public static final String SUBMIT = "PAY.OUT.MANUAL.SUBMIT";
    public static final String CHECK = "PAY.OUT.MANUAL.CHECK";
    public static final String APPROVE = "PAY.OUT.MANUAL.APPROVE";
    public static final String RETURN = "PAY.OUT.MANUAL.RETURN";
    public static final String REJECT = "PAY.OUT.MANUAL.REJECT";
    public static final String EXPORT = "PAY.OUT.MANUAL.EXPORT";
    public static final String PRINT = "PAY.OUT.MANUAL.PRINT";
    public static final String VIEW_PII = "PAY.OUT.MANUAL.VIEW_PII";
    public static final String EXPORT_PII = "PAY.OUT.MANUAL.EXPORT_PII";
}
