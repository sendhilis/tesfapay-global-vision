package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data @Builder
public class BalanceResponse {
    private BigDecimal mainBalance;
    private BigDecimal savingsBalance;
    private BigDecimal loanBalance;
    private int        loyaltyPoints;
    private BigDecimal loyaltyPointsValue;
    private String     currency;
    private Instant    lastUpdated;
}
