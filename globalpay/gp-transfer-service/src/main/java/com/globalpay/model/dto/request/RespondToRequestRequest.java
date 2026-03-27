package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RespondToRequestRequest {

    @NotBlank
    @Pattern(regexp = "^(ACCEPT|DECLINE)$", message = "Action must be ACCEPT or DECLINE")
    private String action;

    /** Required when action = ACCEPT */
    @Pattern(regexp = "^[0-9]{6}$", message = "PIN must be 6 digits")
    private String pin;
}
