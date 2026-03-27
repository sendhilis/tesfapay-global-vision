package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    @Pattern(regexp = "^\\+251[0-9]{9}$")
    private String phone;

    @NotBlank
    @Pattern(regexp = "^[0-9]{6}$", message = "PIN must be 6 digits")
    private String pin;

    private String deviceInfo;
}
