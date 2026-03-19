package com.globalpay.transfer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Send money response DTO.
 * Maps to: API_CONTRACT.md §4 — POST /transfers/send response
 * Front-end: SendMoney.tsx — success confirmation screen
 */
@Data
@Builder
@AllArgsConstructor
public class SendMoneyResponse {
    private String transactionId;
    private String reference;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal totalDeducted;
    private String recipientName;
    private String status;
    private int loyaltyPointsEarned;
    private BigDecimal newBalance;
    private Instant createdAt;
}
