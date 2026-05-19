package com.kb.ltt.domain.exception;

import lombok.Getter;

/**
 * Nem ra khi khong tim thay resource.
 * HTTP 404.
 */
@Getter
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceType;
    private final String id;

    public ResourceNotFoundException(String resourceType, String id) {
        super(String.format("%s not found with id: %s", resourceType, id));
        this.resourceType = resourceType;
        this.id = id;
    }
}
