package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

/** Used internally by other services to debit a wallet */
@Data
public class DebitWalletRequest {
    @NotNull private UUID userId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotBlank private String type;
    @NotBlank private String reference;
    private String counterpartyName;
    private String note;
    private String idempotencyKey;
}
