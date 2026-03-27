package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class MoneyRequestResponse {
    private UUID       requestId;
    private String     reference;
    private String     fromUser;
    private String     toUser;
    private BigDecimal amount;
    private String     note;
    private String     status;
    private Instant    expiresAt;
    private Instant    createdAt;
    // populated on accept
    private UUID       transactionId;
}
