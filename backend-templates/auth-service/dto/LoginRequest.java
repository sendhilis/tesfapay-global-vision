package com.globalpay.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Login request DTO.
 * Maps to: API_CONTRACT.md §1 — POST /auth/login
 * Front-end: LoginPage.tsx (phone + 6-digit MPIN)
 */
@Data
public class LoginRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+251\\d{9}$", message = "Invalid phone format")
    private String phone;

    @NotBlank(message = "PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be 6 digits")
    private String pin;
}
