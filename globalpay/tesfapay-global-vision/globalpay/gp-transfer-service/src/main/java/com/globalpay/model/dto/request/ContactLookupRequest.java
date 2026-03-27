package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ContactLookupRequest {
    @NotBlank
    private String phone;
}
