package com.globalpay.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Registration request DTO.
 * Maps to: API_CONTRACT.md §1 — POST /auth/register
 * Front-end: Onboarding.tsx
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+251\\d{9}$", message = "Phone must be Ethiopian format +251XXXXXXXXX")
    private String phone;

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    private String lastName;

    @NotBlank(message = "PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be exactly 6 digits")
    private String pin;
}
