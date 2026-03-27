package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class SendMoneyRequest {

    @NotBlank(message = "Recipient phone is required")
    @Pattern(regexp = "^\\+251[0-9]{9}$", message = "Must be a valid Ethiopian number (+251XXXXXXXXX)")
    private String recipientPhone;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Minimum transfer amount is ETB 1.00")
    @DecimalMax(value = "50000.00", message = "Maximum single transfer is ETB 50,000")
    private BigDecimal amount;

    @Size(max = 500)
    private String note;

    @NotBlank(message = "PIN is required for confirmation")
    @Pattern(regexp = "^[0-9]{6}$", message = "PIN must be 6 digits")
    private String pin;

    /** Client-supplied idempotency key to prevent duplicate submissions */
    private String idempotencyKey;
}
