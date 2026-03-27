package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class InitiateCashResponse {
    private UUID       transactionId;
    private String     reference;
    private String     otp;               // returned in dev mode only
    private String     agentName;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal netAmount;
    private String     status;
    private Instant    expiresAt;
}
