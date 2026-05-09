package vn.gov.kbnn.vdbas.bff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SenderInfoDto {
    @NotBlank(message = "Ten nguoi chuyen bat buoc")
    private String name;

    @NotBlank(message = "Dia chi nguoi chuyen bat buoc")
    private String address;

    @NotBlank(message = "So tai khoan nguoi chuyen bat buoc")
    private String accountNumber;

    private String customerCode;

    @NotBlank(message = "Ma NH/KB nguoi chuyen bat buoc")
    private String bankCode;

    private String bankName;
    private String identityDoc;
    private LocalDate identityDocIssueDate;
    private String identityDocIssuePlace;
    private String tpcpCode;
}
