package com.kb.ltt.interfaces.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Return/Reject request DTO matching openapi.yaml ReturnRejectRequest schema.
 * Used for return and reject workflow endpoints.
 * Reason must be at least 10 characters.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRejectRequest {

    @NotBlank(message = "REASON is required")
    @Size(min = 10, max = 500, message = "REASON must be between 10 and 500 characters")
    private String reason;
}
