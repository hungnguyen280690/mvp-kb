package com.kb.ltt.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Composite response DTO for getLttDetail use case.
 * Assembles header + details + sender + receiver into a single payload.
 *
 * // FT-001: LTT detail response (composite)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LttDetailResponse {

    private LttHeader header;
    private List<LttDetail> details;
    private LttSender sender;
    private LttReceiver receiver;
}
