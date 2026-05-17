package com.kb.ltt.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for deleting (soft-delete) an LTT.
 *
 * // FT-001: LTT delete request
 * // VAL-16: Delete reason must be >= 10 characters
 * // BIZ-003: Soft-delete, record still accessible via audit
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttDeleteRequest {

    // Optimistic lock version - must match current DB value
    private Integer fVer;

    // VAL-16: Reason must be >= 10 chars and <= 500 chars
    private String deleteReason;
}
