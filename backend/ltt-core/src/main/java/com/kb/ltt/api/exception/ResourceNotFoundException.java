package com.kb.ltt.api.exception;

public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String resource, String id) {
        super("MSG-ERR-SYSTEM", String.format("Khong tim thay %s voi id: %s", resource, id));
    }
}
