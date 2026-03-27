package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder
public class WalletOperationResponse {
    private UUID       transactionId;
    private String     reference;
    private String     status;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal newBalance;
    private int        loyaltyPointsEarned;
}
