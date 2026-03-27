package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank
    @Pattern(regexp = "^\\+251[0-9]{9}$")
    private String phone;

    @NotBlank
    @Size(min = 6, max = 6)
    private String otp;
}
