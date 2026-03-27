package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

/** Used internally by other services to credit a wallet */
@Data
public class CreditWalletRequest {
    @NotNull private UUID userId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotBlank private String type;          // TransactionType name
    @NotBlank private String reference;
    private String counterpartyName;
    private String note;
    private String idempotencyKey;
}
