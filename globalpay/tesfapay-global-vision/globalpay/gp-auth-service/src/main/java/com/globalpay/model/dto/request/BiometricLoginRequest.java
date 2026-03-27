package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BiometricLoginRequest {
    @NotBlank
    private String userId;

    @NotBlank
    private String biometricToken;

    private String deviceInfo;
}
