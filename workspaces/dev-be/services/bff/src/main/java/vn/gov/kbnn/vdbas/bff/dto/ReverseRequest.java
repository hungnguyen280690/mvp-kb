package vn.gov.kbnn.vdbas.bff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ReverseRequest {
    @NotBlank(message = "Ly do dao but toan bat buoc")
    @Size(min = 10, max = 500, message = "Ly do dao phai tu 10-500 ky tu")
    private String reason;

    private List<AttachmentInfoDto> attachments;
}
