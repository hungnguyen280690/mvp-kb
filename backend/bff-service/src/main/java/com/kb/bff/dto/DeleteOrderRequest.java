package com.kb.bff.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Delete request DTO matching openapi.yaml DeletePayOrderRequest schema.
 * Requires reason 10-500 chars + confirmed=true.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteOrderRequest {

    @NotNull(message = "DELETE_REASON is required")
    @Size(min = 10, max = 500, message = "DELETE_REASON must be between 10 and 500 characters")
    private String deleteReason;

    @NotNull(message = "CONFIRMED is required")
    @AssertTrue(message = "CONFIRMED must be true to delete")
    private Boolean confirmed;
}
