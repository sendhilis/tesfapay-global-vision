package com.globalpay.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WalletCreditedEvent {
    private UUID       eventId;
    private UUID       transactionId;
    private String     reference;
    private UUID       userId;
    private String     walletId;
    private BigDecimal amount;
    private String     type;
    private String     currency;
    private Instant    timestamp;
}
