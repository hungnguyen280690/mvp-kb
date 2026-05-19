package com.kb.bff.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Workflow action request DTO matching openapi.yaml WorkflowActionRequest schema.
 * Used for check-approve and approve endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowActionRequest {

    @Size(max = 500, message = "COMMENT must be at most 500 characters")
    private String comment;
}
