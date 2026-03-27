package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ChangePinRequest {
    @NotBlank
    @Pattern(regexp = "^[0-9]{6}$")
    private String currentPin;

    @NotBlank
    @Pattern(regexp = "^[0-9]{6}$")
    private String newPin;
}
