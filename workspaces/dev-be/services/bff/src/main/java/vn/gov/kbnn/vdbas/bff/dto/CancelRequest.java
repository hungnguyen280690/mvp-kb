package vn.gov.kbnn.vdbas.bff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CancelRequest {
    @NotBlank(message = "Ly do huy bat buoc")
    @Size(min = 10, max = 500, message = "Ly do huy phai tu 10-500 ky tu")
    private String reason;
}
