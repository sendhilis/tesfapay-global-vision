package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^\\+251[0-9]{9}$", message = "Phone must be a valid Ethiopian number (+251XXXXXXXXX)")
    private String phone;

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 100)
    private String lastName;

    @NotBlank(message = "PIN is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "PIN must be exactly 6 digits")
    private String pin;
}
