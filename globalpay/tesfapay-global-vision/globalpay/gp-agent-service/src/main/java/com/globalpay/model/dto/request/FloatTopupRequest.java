package com.globalpay.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data public class FloatTopupRequest {
    @NotNull @DecimalMin("100.00") private BigDecimal amount;
    private String note;
}
