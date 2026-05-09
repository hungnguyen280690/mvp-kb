package vn.gov.kbnn.vdbas.bff.dto;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class AttachmentInfoDto {
    private UUID id;
    private String fileName;
    private long fileSize;
    private String contentType;
    private String uploadedBy;
    private OffsetDateTime uploadedAt;
}
