package com.globalpay.transfer.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Send money request DTO.
 * Maps to: API_CONTRACT.md §4 — POST /transfers/send
 * Front-end: SendMoney.tsx
 */
@Data
public class SendMoneyRequest {

    @NotBlank(message = "Recipient phone is required")
    private String recipientPhone;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Minimum transfer amount is ETB 1.00")
    @DecimalMax(value = "50000.00", message = "Maximum transfer amount is ETB 50,000")
    private BigDecimal amount;

    @Size(max = 500)
    private String note;

    @NotBlank(message = "PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be 6 digits")
    private String pin;

    private String idempotencyKey;
}
