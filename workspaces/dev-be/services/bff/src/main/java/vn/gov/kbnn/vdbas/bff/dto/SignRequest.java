package vn.gov.kbnn.vdbas.bff.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SignRequest {
    @NotBlank(message = "Du lieu chu ky so bat buoc")
    private String signatureData;

    @NotBlank(message = "Chung thu so bat buoc")
    private String signerCert;
}
