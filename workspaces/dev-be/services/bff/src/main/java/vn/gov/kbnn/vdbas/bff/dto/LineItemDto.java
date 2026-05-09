package vn.gov.kbnn.vdbas.bff.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LineItemDto {
    private String id;
    private String fundCode;
    private String naturalAccount;
    private String dvqhns;
    private String budgetLevel;
    private String chapter;
    private String economicSector;
    private String ndkt;
    private String area;
    private String program;
    private String fundSource;
    private String treasuryCode;
    private String reserve;

    @NotBlank(message = "Dien giai khoan muc bat buoc")
    @Size(min = 1, max = 250, message = "Dien giai toi da 250 ky tu")
    private String description;

    @DecimalMin(value = "0.01", message = "So tien khoan muc phai lon hon 0")
    private BigDecimal itemAmount;
}
