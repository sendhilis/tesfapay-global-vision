package com.globalpay.model.enums;
public enum TransactionStatus {
    PENDING, PENDING_AGENT, COMPLETED, FAILED, REVERSED, EXPIRED,
    PENDING_REVERSAL, // debit succeeded but credit failed - awaiting auto-reversal
    UNDER_REVIEW      // suspicious activity flagged - manual review required
}