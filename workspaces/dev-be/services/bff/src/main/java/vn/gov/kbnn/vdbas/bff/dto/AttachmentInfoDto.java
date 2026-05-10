package vn.gov.kbnn.vdbas.bff.dto;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class AttachmentInfoDto {
    private Long id;
    private String fileName;
    private long fileSize;
    private String contentType;
    private String uploadedBy;
    private OffsetDateTime uploadedAt;
}
