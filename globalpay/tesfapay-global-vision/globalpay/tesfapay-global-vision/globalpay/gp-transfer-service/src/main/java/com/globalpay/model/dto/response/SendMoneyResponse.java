package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class SendMoneyResponse {
    private UUID       transactionId;
    private String     reference;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal totalDeducted;
    private String     recipientName;
    private String     status;
    private int        loyaltyPointsEarned;
    private BigDecimal newBalance;
    private Instant    createdAt;
}
