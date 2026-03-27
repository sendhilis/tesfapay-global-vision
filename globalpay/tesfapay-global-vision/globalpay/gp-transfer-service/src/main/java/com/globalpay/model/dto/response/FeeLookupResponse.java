package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data @Builder
public class FeeLookupResponse {
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal totalDeducted;
    private String     currency;
}
