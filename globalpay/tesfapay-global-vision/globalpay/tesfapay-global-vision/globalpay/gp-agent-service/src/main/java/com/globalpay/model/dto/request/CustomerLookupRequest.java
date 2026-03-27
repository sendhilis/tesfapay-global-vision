package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data public class CustomerLookupRequest {
    @NotBlank private String query;  // phone or walletId
}
