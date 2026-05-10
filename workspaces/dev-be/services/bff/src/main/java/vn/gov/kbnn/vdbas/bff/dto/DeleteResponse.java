package vn.gov.kbnn.vdbas.bff.dto;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class DeleteResponse {
    private Long id;
    private String status;
    private OffsetDateTime deletedAt;
}
