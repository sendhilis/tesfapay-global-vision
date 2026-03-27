package com.globalpay.wallet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Balance response DTO.
 * Maps to: API_CONTRACT.md §3 — GET /wallet/balance response
 * Front-end: WalletHome.tsx — balance card
 */
@Data
@Builder
@AllArgsConstructor
public class BalanceResponse {
    private BigDecimal mainBalance;
    private BigDecimal savingsBalance;
    private BigDecimal loanBalance;
    private int loyaltyPoints;
    private BigDecimal loyaltyPointsValue;
    private String currency;
    private Instant lastUpdated;
}
