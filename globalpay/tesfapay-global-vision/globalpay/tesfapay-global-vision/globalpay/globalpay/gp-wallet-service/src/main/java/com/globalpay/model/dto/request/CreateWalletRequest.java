package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.UUID;

@Data
public class CreateWalletRequest {
    @NotNull  private UUID userId;
    @NotBlank private String walletId;
    @NotBlank private String currency;
}
