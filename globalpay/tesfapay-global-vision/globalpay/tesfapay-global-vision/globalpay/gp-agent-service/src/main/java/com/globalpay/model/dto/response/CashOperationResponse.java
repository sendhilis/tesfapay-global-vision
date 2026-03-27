package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class CashOperationResponse {
    private UUID       transactionId;
    private String     reference;
    private String     customerName;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal netAmount;
    private BigDecimal commission;
    private BigDecimal newFloatBalance;
    private String     status;
    private Instant    time;
}
