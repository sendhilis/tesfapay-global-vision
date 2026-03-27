package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data public class CashOutRequest {
    @NotBlank private String customerPhone;
    @NotNull @DecimalMin("10.00") private BigDecimal amount;
    @NotBlank private String otp;
    @NotBlank private String agentPin;
}
