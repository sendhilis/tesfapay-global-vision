package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RequestMoneyRequest {

    @NotBlank(message = "Target phone is required")
    @Pattern(regexp = "^\\+251[0-9]{9}$")
    private String fromPhone;

    @NotNull
    @DecimalMin("1.00")
    private BigDecimal amount;

    @Size(max = 500)
    private String note;
}
