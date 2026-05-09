package vn.gov.kbnn.vdbas.bff.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ReceiverInfoDto {
    @NotBlank(message = "Ten nguoi nhan bat buoc")
    private String name;

    private String address;

    @NotBlank(message = "So tai khoan nguoi nhan bat buoc")
    private String accountNumber;

    @NotBlank(message = "Ma NH/KB nguoi nhan bat buoc")
    private String bankCode;

    private String bankName;

    @NotBlank(message = "Ten tai khoan nguoi nhan bat buoc")
    private String accountName;

    private String identityDoc;
    private LocalDate identityDocIssueDate;
    private String identityDocIssuePlace;
}
