package com.kb.ltt.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeleteRequest {

    @NotNull(message = "Vui long nhap ly do")
    @Size(min = 10, max = 500, message = "Ly do phai tu 10 den 500 ky tu")
    private String reason;

    @AssertTrue(message = "Phai xac nhan da ra soat")
    @NotNull
    private Boolean confirmReviewed;
}
